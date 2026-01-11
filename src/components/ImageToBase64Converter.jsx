import React, { useState } from 'react';

const ImageToBase64Converter = () => {
    const [ganeshaBase64, setGaneshaBase64] = useState('');
    const [laxmiBase64, setLaxmiBase64] = useState('');
    const [copied, setCopied] = useState('');

    const handleImageUpload = (event, setBase64, imageName) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBase64(reader.result);
                console.log(`${imageName} Base64:`, reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const copyToClipboard = (text, name) => {
        navigator.clipboard.writeText(text);
        setCopied(name);
        setTimeout(() => setCopied(''), 2000);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: '#667eea' }}>Image to Base64 Converter</h2>
            <p style={{ color: '#6b7280' }}>
                Convert your Lord Ganesha and Goddess Laxmi images to Base64 for the PDF generator
            </p>

            {/* Lord Ganesha */}
            <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h3 style={{ color: '#111827' }}>
                    <span role="img" aria-label="ganesha">🕉️</span> Lord Ganesha Image
                </h3>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setGaneshaBase64, 'Ganesha')}
                    style={{
                        padding: '10px',
                        border: '2px solid #667eea',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        width: '100%'
                    }}
                />

                {ganeshaBase64 && (
                    <>
                        <div style={{ marginTop: '10px' }}>
                            <img
                                src={ganeshaBase64}
                                alt="Ganesha Preview"
                                style={{
                                    maxWidth: '150px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>
                        <textarea
                            value={ganeshaBase64}
                            readOnly
                            rows={3}
                            style={{
                                width: '100%',
                                marginTop: '10px',
                                padding: '10px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontFamily: 'monospace'
                            }}
                        />
                        <button
                            onClick={() => copyToClipboard(ganeshaBase64, 'ganesha')}
                            style={{
                                marginTop: '10px',
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {copied === 'ganesha' ? '✓ Copied!' : 'Copy Ganesha Base64'}
                        </button>
                    </>
                )}
            </div>

            {/* Goddess Laxmi */}
            <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h3 style={{ color: '#111827' }}>
                    <span role="img" aria-label="laxmi">🪷</span> Goddess Laxmi Image
                </h3>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setLaxmiBase64, 'Laxmi')}
                    style={{
                        padding: '10px',
                        border: '2px solid #667eea',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        width: '100%'
                    }}
                />

                {laxmiBase64 && (
                    <>
                        <div style={{ marginTop: '10px' }}>
                            <img
                                src={laxmiBase64}
                                alt="Laxmi Preview"
                                style={{
                                    maxWidth: '150px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>
                        <textarea
                            value={laxmiBase64}
                            readOnly
                            rows={3}
                            style={{
                                width: '100%',
                                marginTop: '10px',
                                padding: '10px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontFamily: 'monospace'
                            }}
                        />
                        <button
                            onClick={() => copyToClipboard(laxmiBase64, 'laxmi')}
                            style={{
                                marginTop: '10px',
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {copied === 'laxmi' ? '✓ Copied!' : 'Copy Laxmi Base64'}
                        </button>
                    </>
                )}
            </div>

            {/* Instructions */}
            {ganeshaBase64 && laxmiBase64 && (
                <div style={{
                    background: '#f0fdf4',
                    border: '2px solid #86efac',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <h3 style={{ color: '#166534', marginTop: 0 }}>✅ Next Steps:</h3>
                    <ol style={{ color: '#166534', lineHeight: '1.8' }}>
                        <li>Copy both Base64 strings above</li>
                        <li>Open <code>PDFGenerator.js</code></li>
                        <li>Replace <code>YOUR_GANESHA_IMAGE_BASE64</code> with the Ganesha Base64</li>
                        <li>Replace <code>YOUR_LAXMI_IMAGE_BASE64</code> with the Laxmi Base64</li>
                        <li>Save the file</li>
                        <li>Your PDF generator is ready to use! 🎉</li>
                    </ol>
                </div>
            )}

            {/* Code Preview */}
            {ganeshaBase64 && laxmiBase64 && (
                <div style={{
                    background: '#1e293b',
                    borderRadius: '12px',
                    padding: '20px',
                    marginTop: '20px',
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    overflow: 'auto'
                }}>
                    <div style={{ color: '#22d3ee', marginBottom: '10px' }}>
            // PDFGenerator.js - Replace these lines:
                    </div>
                    <div style={{ color: '#fbbf24' }}>
                        const LORD_GANESHA_BASE64 = <span style={{ color: '#4ade80' }}>'{ganeshaBase64.substring(0, 50)}...'</span>;
                    </div>
                    <div style={{ color: '#fbbf24', marginTop: '5px' }}>
                        const GODDESS_LAXMI_BASE64 = <span style={{ color: '#4ade80' }}>'{laxmiBase64.substring(0, 50)}...'</span>;
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageToBase64Converter;