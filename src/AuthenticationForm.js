import React, { useState } from 'react';
import { authenticate, startMultilateralProcess, convertFileToBase64, getHashFEA, readFileAsText, cleanCertificateContent, ensureBase64Content } from './Api';

/**
 * Formulario de autenticación y envío de documentos para firma.
 */
function AuthenticationForm() {
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [file, setFile] = useState(null);
    const [certificate, setCertificate] = useState(null);

    /**
     * Maneja el envío del formulario.
     * @param {Event} e - Evento de envío del formulario.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = await authenticate(user, password);
            console.log('Token:', token);

            const base64Data = await convertFileToBase64(file);

            const cleanedCertificateContent = cleanCertificateContent(await readFileAsText(certificate));
            const finalCertificateContent = await ensureBase64Content(cleanedCertificateContent);

            const response = await startMultilateralProcess(token, file.name, base64Data, 'SHA256', 'PDF', 1);
            const getHashFea = await getHashFEA(token, response.multilateralId, finalCertificateContent);

            console.log('Hash FEA:', getHashFea);

        } catch (error) {
            console.error('Error:', error);
        }
    }

    return (
        <div>
            <h2>Prueba de concepto SeguriData</h2>
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
                <div>
                    <label>Certificado:</label>
                    <input type="file" onChange={(e) => setCertificate(e.target.files[0])} required />
                </div>
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
}

export default AuthenticationForm;