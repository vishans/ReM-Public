#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>
#include <IRrecv.h>
#include <IRutils.h>

#define DEBUG_MODE false

/*
Be sure to make sure modify each line
marked with <- (an arrow)
*/

// Wi-Fi credentials
const char *ssid = "ssid"; // <- 
const char *password = "password"; // <-

// Server URL
const char *serverUrl = "http://<your server's address>/api/appliance"; // <-

// Appliance ID
const char *applianceId = "ABCD"; // <- The server expects this to be unique for each appliance

// IR configurations
const uint16_t kIrLed = 4; // GPIO pin for IR LED
IRsend irsend(kIrLed);

const uint16_t kRecvPin = 14; // GPIO pin for IR receiver
IRrecv irrecv(kRecvPin);
decode_results results;

// State variables
String currentState = "send";
unsigned long receiveStartTime = 0;
const unsigned long receiveDuration = 10 * 60 * 1000; // 10 minutes in milliseconds

// LED configurations
const uint8_t ledPin = 2;         // GPIO pin for built-in LED
unsigned long previousMillis = 0; // Store the last time the LED was updated
const long interval = 500;        // Interval at which to blink (milliseconds)
bool ledState = LOW;              // Store the state of the LED

void setup()
{

#if DEBUG_MODE
  Serial.begin(115200);
#endif

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, ledState);
  irsend.begin();
  // irrecv.enableIRIn();  // Start the receiver

  connectToWiFi();
}

void loop()
{
  if (WiFi.status() == WL_CONNECTED)
  {
    HTTPClient http;
    String url = String(serverUrl) + "/" + applianceId + "/poll";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    // Prepare the payload
    StaticJsonDocument<200> doc;
    doc["state"] = currentState;
    doc["message"] = "polling";

    String payload;
    serializeJson(doc, payload);

    // Send POST request
    int httpResponseCode = http.POST(payload);

    if (httpResponseCode == 200)
    {
      String response = http.getString();

#if DEBUG_MODE
      Serial.println("Response: " + response);
#endif

      // Parse the response
      StaticJsonDocument<1024> responseDoc;
      deserializeJson(responseDoc, response);

      if (responseDoc.containsKey("message"))
      {
        String command = responseDoc["message"]["command"];

#if DEBUG_MODE
        Serial.println(command);
#endif

        if (command == "receive")
        {
          currentState = "receive";
          irrecv.enableIRIn();
          receiveStartTime = millis();
        }
       
        else //(command == "send")
        {
          currentState = "send";
          int protocol = responseDoc["message"]["signal"]["protocol"];
          if (protocol != -1)
          {

            uint32_t value = responseDoc["message"]["signal"]["value"];
            uint16_t bits = responseDoc["message"]["signal"]["bits"];

            sendReceivedIRSignal(protocol, value, bits);
          }
        }
      }
    }
#if DEBUG_MODE
    else
    {

      Serial.println("Error on HTTP request: " + String(httpResponseCode));
    }
#endif

    http.end();
  }
  else{
    connectToWiFi();
  }

  // Handle IR receiving if in receive mode
  if (currentState == "receive")
  {
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= interval)
    {
      previousMillis = currentMillis;
      ledState = !ledState;
      digitalWrite(ledPin, ledState);
    }

    if (irrecv.decode(&results))
    {
      sendReceivedIRCode(results.decode_type, results.value, results.bits);
      irrecv.resume(); // Receive the next value
    }

    // Check if the receive duration has elapsed
    if (millis() - receiveStartTime > receiveDuration)
    {
      currentState = "send";
      irrecv.disableIRIn();      // Disable IR receiver
      digitalWrite(ledPin, LOW); // Turn off the LED when exiting receive mode
    }
  }
  else
  {
    digitalWrite(ledPin, LOW); // Ensure LED is off when not in receive mode
  }

  delay(250); // Polling interval
}

void sendReceivedIRSignal(int protocol, uint32_t value, uint16_t bits)
{
  switch (protocol)
  {

  case SYMPHONY:
    irsend.sendSymphony(value, bits);
    break;

  case NEC:
    irsend.sendNEC(value, bits);
    break;

  default:
#if DEBUG_MODE
    Serial.println("Unknown protocol");
#endif
    break;
  }
}

void sendReceivedIRCode(decode_type_t protocol, uint32_t value, uint16_t bits)
{
  if (WiFi.status() == WL_CONNECTED)
  {
    HTTPClient http;
    String url = String(serverUrl) + "/receive" + "/" + applianceId;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    // Prepare the payload
    StaticJsonDocument<200> doc;
    doc["protocol"] = protocol; // Send protocol as an integer
    doc["value"] = value;       // Send value directly
    doc["bits"] = bits;

    String payload;
    serializeJson(doc, payload);

    // Send POST request
    int httpResponseCode = http.POST(payload);

    if (httpResponseCode == 200)
    {
      String response = http.getString();
     
    }
#if DEBUG_MODE
    else
    {
      Serial.println("Error on HTTP request: " + String(httpResponseCode));
    }
#endif

    http.end();
  }
}


void connectToWiFi() 
{
    unsigned int t = millis();
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED && (millis() - t) < 10000)
    {
      digitalWrite(ledPin, HIGH);  
      delay(100);      
      digitalWrite(ledPin, LOW); 
      delay(100);
    }

    digitalWrite(ledPin, LOW); // Turn off the LED once connected

}