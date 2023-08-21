import React, { useState, useEffect } from 'react';
import { authenticate, startMultilateralProcess, convertFileToBase64, getHashFEA, readFileAsText, cleanCertificateContent, ensureBase64Content, getCertificateSerial, updateMultilateralProcess, finalizeMultilateralProcess } from './Api';

function AuthenticationForm() {
    const [user, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [file, setFile] = useState(null);
    const [certificate, setCertificate] = useState(null);
    const [multilateralId, setMultilateralId] = useState(null);
    const [token, setToken] = useState(null);
    const [serial, setSerial] = useState(null);

    useEffect(() => {
        const handleIframeMessage = async (event) => {
            if (typeof event.data === 'string' && event.data.startsWith('MI')) {
                console.log("Firma PKCS#7 recibida:", event.data);
                
                if (token && multilateralId && serial) {
                    try {
                        const updateResponse = await updateMultilateralProcess(token, multilateralId, serial, event.data);
                        console.log("Respuesta de /update:", updateResponse);
        
                        const finalizeResponse = await finalizeMultilateralProcess(token, multilateralId);
                        console.log("Respuesta de /finalize:", finalizeResponse);
        
                        finalizeResponse.forEach((item, index) => {
                            let fileType = '';
                            let fileName = '';
                            
                            if (item.evidenceType === 'PDF') {
                                fileType = 'application/pdf';
                                fileName = `documento_firmado_${index}.pdf`;
                            } else if (item.evidenceType === 'NOM2016') {
                                fileType = 'application/pdf'; 
                                fileName = `documento_NOM2016_${index}.pdf`; 
                            }
    
                            const blob = new Blob([Buffer.from(item.data, 'base64')], { type: fileType });
                            const link = document.createElement('a');
                            link.href = window.URL.createObjectURL(blob);
                            link.download = fileName;
                            link.click();
                        });
        
                    } catch (error) {
                        console.error("Error:", error);
                    }
                }
            }
        };
        
        window.addEventListener('message', handleIframeMessage);
        
        return () => {
            window.removeEventListener('message', handleIframeMessage);
        };
    }, [token, multilateralId, serial]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const authToken = await authenticate(user, password);
            setToken(authToken);
            console.log('Token:', authToken);

            const base64Data = await convertFileToBase64(file);

            const originalCertificateContent = await readFileAsText(certificate);
            console.log("Contenido original del certificado:", originalCertificateContent);

            const cleanedCertificateContent = cleanCertificateContent(originalCertificateContent);
            const finalCertificateContent = await ensureBase64Content(cleanedCertificateContent);
            
            // Usamos el contenido original del certificado para obtener el serial
            const certSerial = await getCertificateSerial(originalCertificateContent);
            setSerial(certSerial);
            console.log("Serial del certificado:", certSerial);

            const response = await startMultilateralProcess(authToken, file.name, base64Data, 'SHA256', 'PDF', 1);
            setMultilateralId(response.multilateralId);
            console.log('ID del proceso multilateral:', response.multilateralId);
            const getHashFea = await getHashFEA(authToken, response.multilateralId, finalCertificateContent);
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
            <div style={{ marginTop: '20px' }}>
                <h3>Firma Digital</h3>
                <iframe src="/SgData_PKCS7FromHash_File.html" width="100%" height="600px" title="Digital Signature"></iframe>
            </div>
        </div>
    );
}

export default AuthenticationForm;