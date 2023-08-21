import axios from 'axios';
import forge from 'node-forge';

const BASE_URL = 'https://feb.seguridata.com/ssignrest';

/**
 * Autentica al usuario y devuelve un token.
 * @param {string} user - Nombre de usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {string} Token de autenticación.
 * @throws {Error} Si la autenticación falla o hay un error en la solicitud.
 */
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
            throw new Error(response.data.description || 'Error desconocido durante la autenticación.');
        }
    } catch (error) {
        console.error('Server response:', error);
        throw new Error(error.response.data.description || 'Error desconocido durante la autenticación.');
    }
}

/**
 * Convierte un archivo a formato Base64.
 * @param {File} file - Archivo a convertir.
 * @returns {Promise<string>} Datos del archivo en formato Base64.
 * @throws {Error} Si hay un error durante la conversión.
 */
export function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

/**
 * Inicia un proceso multilateral de firma.
 * @param {string} token - Token de autenticación.
 * @param {string} data - Nombre del documento a firmar.
 * @param {string} document2Sign - Documento en formato Base64.
 * @param {string} hashAlg - Algoritmo de digestión (ej. SHA256).
 * @param {string} processType - Tipo de proceso de firma (ej. PDF).
 * @param {number} totalSigners - Número total de firmantes.
 * @returns {Object} Respuesta del servidor.
 * @throws {Error} Si hay un error en la solicitud.
 */
export async function startMultilateralProcess(token, data, document2Sign, hashAlg, processType, totalSigners) {
    const headers = {
        'Authorization': token,
    };

    try {
        const response = await axios.post(`${BASE_URL}/multilateral/`, {
            data: data,
            document2Sign: {
                base64: true,
                data: document2Sign,
                name: data
            },
            hashAlg: hashAlg,
            processType: processType,
            totalSigners: totalSigners
        }, { headers: headers });

        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(response.data.errorMessage || 'Error desconocido al iniciar el proceso multilateral.');
        }
    } catch (error) {
        console.error('Server response:', error);
        throw new Error(error.response.data.errorMessage || 'Error desconocido al iniciar el proceso multilateral.');
    }
}

/**
 * Lee un archivo como texto.
 * @param {File} file - Archivo a leer.
 * @returns {Promise<string>} Contenido del archivo como texto.
 * @throws {Error} Si hay un error durante la lectura.
 */
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/**
 * Limpia el contenido del certificado, eliminando encabezados y pies de página.
 * @param {string} content - Contenido del certificado.
 * @returns {string} Certificado limpio.
 */
export function cleanCertificateContent(content) {
    return content.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').trim();
}

/**
 * Verifica si una cadena está en formato Base64.
 * @param {string} str - Cadena a verificar.
 * @returns {boolean} Verdadero si la cadena está en Base64, falso en caso contrario.
 */
function isBase64(str) {
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
}

/**
 * Asegura que el contenido proporcionado esté en formato Base64.
 * @param {string|Blob} input - Contenido o archivo a verificar.
 * @returns {Promise<string>} Contenido en formato Base64.
 * @throws {Error} Si el tipo de entrada no es válido.
 */
export async function ensureBase64Content(input) {
    if (typeof input === 'string') {
        return input;
    } else if (input instanceof Blob) {
        return await convertFileToBase64(input);
    } else {
        throw new Error("Invalid input type for ensureBase64Content");
    }
}

/**
 * Obtiene el hash FEA.
 * @param {string} token - Token de autenticación.
 * @param {number} multilateralId - ID del proceso multilateral.
 * @param {string} certificate - Certificado en formato Base64.
 * @returns {Object} Respuesta del servidor.
 * @throws {Error} Si hay un error en la solicitud.
 */
export async function getHashFEA(token, multilateralId, certificate) {
    const headers = {
        'Authorization': token,
    };

    const body = {
        signerCertificate: {
            base64: true,
            data: certificate,
            evidenceType: "CERTIFICATE"
        }
    };

    try {
        const response = await axios.post(`${BASE_URL}/multilateral/getHash/${multilateralId}`, body, { headers: headers });

        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(response.data.errorMessage || 'Error desconocido al obtener el hash FEA.');
        }
    } catch (error) {
        console.error('Server response:', error);
        throw new Error(error.response.data.errorMessage || 'Error desconocido al obtener el hash FEA.');
    }
}

// Función para obtener el serial del certificado
export async function getCertificateSerial(pemCertificate) {
    try {
        // Decodificar el certificado PEM
        const cert = forge.pki.certificateFromPem(pemCertificate);

        // Obtener el serial del certificado
        const serial = cert.serialNumber;

        return serial;
    } catch (error) {
        console.error("Error al obtener el serial del certificado:", error);
        return null;
    }
};

/**
 * 
 * @param {*} token  Token de autenticación.
 * @param {*} multilateralId  ID del proceso multilateral.
 * @param {*} serial  Serial del certificado.
 * @param {*} signature  Firma del certificado.
 * @returns 
 */
export async function updateMultilateralProcess(token, multilateralId, serial, signedMessage) {
    const headers = {
        'Authorization': token,
    };

    try {
        const response = await axios.post(`${BASE_URL}/multilateral/update/${multilateralId}`, {
            serial: serial,
            signedMessage: {
                base64: true,
                data: signedMessage,
                name: "Firma.p7"
            }
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

// Función para finalizar el proceso multilateral
export const finalizeMultilateralProcess = async (token, multilateralId) => {
    const url = `https://feb.seguridata.com/ssignrest/multilateral/finalize/${multilateralId}/false`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': token
            }
        });

        return response.data;
    } catch (error) {
        throw new Error(`Error al finalizar el proceso multilateral: ${error.response.statusText}`);
    }
};
