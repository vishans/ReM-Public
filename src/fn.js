export const makeRequest = async (url, options) => {
    
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response;
  };