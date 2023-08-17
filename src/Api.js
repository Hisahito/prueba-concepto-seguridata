import axios from 'axios';

const BASE_URL = 'https://feb.seguridata.com/ssignrest';


export async function authenticate(user, password) {
    try {
      const response = await axios.post(`${BASE_URL}/user`, null, {
        params: {
          user: user,
          password: password
        }
      });
  
      if (response.status === 200) {
        return response.data.token;
      } else {
        throw new Error(response.data.description);
      }
    } catch (error) {
      throw new Error(error.response.data.description);
    }
  }  

  export function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }

 export async function startMultilateralProcess(token, data, document2Sign, hashAlg, processType, totalSigners) {
    const headers = {
        'Authorization': token,
      };      
  
    try {
      const response = await axios.post(`${BASE_URL}/multilateral/`, {
        data: data,
        document2Sign: {
          base64: true,
          data: document2Sign, // Convierte el archivo a Base64
          name: data
        },
        hashAlg: hashAlg,
        processType: processType,
        totalSigners: totalSigners
      }, { headers: headers });
  
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(response.data.errorMessage);
      }
    } catch (error) {
        console.error('Server response:', error);
        throw new Error(error.response.data.errorMessage || 'Error');
    }
  }
  
  