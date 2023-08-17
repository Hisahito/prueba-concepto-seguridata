import React, { useState } from 'react';
import { authenticate, startMultilateralProcess, convertFileToBase64 } from './Api';


function AuthenticationForm() {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const token = await authenticate(user, password);
        console.log('Token:', token);
      // Convertir el archivo a Base64
      const base64Data = await convertFileToBase64(file);

      const response = await startMultilateralProcess(token, file.name, base64Data, 'SHA256', 'PDF', 1);
      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }
}
  

  return (
    <div>
      <h2>Autenticación SeguriData</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Usuario:</label>
          <input type="text" value={user} onChange={(e) => setUser(e.target.value)} required />
        </div>
        <div>
          <label>Contraseña:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label>Documento a firmar:</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
        </div>
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default AuthenticationForm;
