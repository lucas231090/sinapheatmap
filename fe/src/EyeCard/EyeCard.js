import React from 'react';
import './EyeCard.css';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom'

function EyeCard({ file, callFunction }) {
    const navigate = useNavigate()

    function handleClick() {
        callFunction(file._id)
    }
    return (
        <div className="eye-card">
            <h3>{file.filename}</h3>
            <p><strong>Descrição:</strong> {file.description}</p>
            <p><strong>Data de upload:</strong> {file.jsonData[0]["Data-Hora"]}</p>
            <div className='action-line'>
                <button className="download-btn" onClick={() => navigate(`eyeheatmap/${file._id}`)}>
                    Ver Heatmap
                </button>
                <button type="button" className='trash' onClick={() => handleClick()}>
                    <DeleteIcon style={{ color: 'white' }} />
                </button>
            </div>
        </div>
    );
}

export default EyeCard;
