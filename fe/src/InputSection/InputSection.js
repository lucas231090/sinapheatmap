import React from 'react';
import { useEffect, useRef, useState } from "react";
import './InputSection.css';
import DeleteIcon from '@mui/icons-material/Delete';
import EyeCard from '../EyeCard/EyeCard';
import Modal from 'react-modal';

function InputSection() {
    // Referencia para o valor do input file para retirar quando apertar o botao de lixo
    const inputFile = useRef(null);
    const imageFile = useRef(null)

    // Referencia para trocar de imagem de arquivo(visual)
    const imageCSVRef = useRef();
    const imageIMGRef = useRef();

    // Stado no qual ira guardar o arquivo e o nome do Arquivo(Sera possivel mudar o nome no input text)
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState();
    const [selectedImageName, setSelectedImageName] = useState();
    const [selectedName, setSelectedName] = useState("");


    const [modalIsOpen, setIsOpen] = useState({ open: false, id: '' });


    // Estado no qual ira receber os os testes
    const [getFiles, setGetFiles] = useState([]);

    // Evento que ira receber o arquivo
    const handleFileChange = (event, setFile, setName) => {
        const file = event.target.files[0];
        // setSelectedFile(file);
        // setSelectedFileName(file.name)
        setFile(file)
        setName(file.name)
        console.log(file);
    };

    const handleDeleteFile = (e) => {
        console.log("calling from child component");

        const deletion = {
            "active": false
        }
        fetch(`http://localhost:3333/eyetracking/${e}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deletion)
        })
            .then(response => {
                console.log('TESTE', response);
                fetchData();
            })
            .catch(error => console.log(error));
    }

    // Evento que ira retirar o arquivo
    const handleFileRemove = () => {
        if (selectedFile) {
            inputFile.current.value = "";
            inputFile.current.type = "text";
            inputFile.current.type = "file";
            setSelectedFile(null);
            setSelectedFileName(""); // Reseta o nome do arquivo
            setSelectedName("");
        }

        if (selectedImage) {
            imageFile.current.value = "";
            imageFile.current.type = "text";
            imageFile.current.type = "file";
            setSelectedImage(null);
            setSelectedImageName(""); // Reseta o nome do arquivo
        }
    };

    // Evento que irá enviar o arquivo pro servidor
    // NÃO ESTA FUNCIONANDO :( -> Não sei passar o arquivo como string binario
    const handleFileSubmit = (event) => {
        if (!selectedFile || selectedName === "" || !selectedImage) {
            alert("Por favor, selecione um arquivo , uma imagem e insira um nome.");
            return;
        }

        const submit = new FormData()
        submit.append("csvFile", selectedFile)
        submit.append("filename", selectedName)
        submit.append("mediaFile", selectedImage)
        submit.append("description", "Teste")

        fetch('http://localhost:3333/heatmap', {
            method: 'POST',
            body: submit
        })
            .then(response => {
                console.log(response);
                fetchData();
            })
            .catch(error => console.log(error));

        handleFileRemove()
    };

    // Busca os arquivos e coloca no getFiles
    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:3333/eyetracking');
            const data = await res.json();
            console.log('Data', data);
            setGetFiles(data); // Se data for uma lista
        } catch (err) {
            console.log(err.message);
        }
    };

    // Busca os arquivos dos testes uma vez
    useEffect(() => {
        // Chama a função apenas uma vez na montagem do componente
        fetchData();
    }, []); // Lista de dependências vazia garante que o efeito seja executado apenas uma vez

    // Caso o selectedFile seja atualizado, mude a Imagem
    useEffect(() => {
        imageCSVRef.current.src = selectedFile ?
            "CsvFile.png" :
            "Upload.png";
    }, [selectedFile, imageCSVRef]);

    useEffect(() => {
        imageIMGRef.current.src = selectedImage ?
            URL.createObjectURL(selectedImage) :
            "Upload.png";
        console.log(selectedImage);
    }, [selectedImage, imageIMGRef]);

    // Função que abre a modal
    function abrirModal(id) {
        setIsOpen({ open: true, id: id });
    }

    // Função que fecha a modal
    function fecharModal(value) {
        if (value) {
            handleDeleteFile(modalIsOpen.id)
        }
        setIsOpen({ open: false, id: '' });
    }

    return (
        <div className="input-section">
            <Modal
                isOpen={modalIsOpen.open}
                onRequestClose={fecharModal}
                contentLabel="Modal de exemplo"
                className='modal'
            >
                <div className='modal-inside'>
                    <h2>Você que mesmo deletar esse arquivo?</h2>

                    <div className='button-row'>
                        <button className='no' onClick={e => fecharModal(!e)}>Não</button>
                        <button className='submit' onClick={e => fecharModal(e)}>Sim</button>
                    </div>
                </div>
            </Modal>
            {/* Primeira Caixa */}
            <div className='inner-box '>
                {/* Area do Input */}
                <div className="parent">
                    <div className="file-upload">
                        <img ref={imageCSVRef} alt="upload" className='upload-image' />
                        <h3 style={{ margin: 0 }}>{selectedFileName || "Upload Arquivo .csv"}</h3>
                        <p>Arquivos .CSV</p>
                        <input type="file" onChange={(event) => handleFileChange(event, setSelectedFile, setSelectedFileName)} ref={inputFile} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                    </div>
                </div>
                <div className="parent">
                    <div className="file-upload">
                        <img ref={imageIMGRef} alt="upload" className='upload-image' />
                        <h3 style={{ margin: 0 }}>{selectedImageName || "Upload Arquivo de Imagem"}</h3>
                        <p>Arquivos .png</p>
                        <input type="file" onChange={(event) => handleFileChange(event, setSelectedImage, setSelectedImageName)} ref={imageFile} accept="image/png" />
                    </div>
                </div>
                {/* Area de Texto/Apagar/Enviar */}
                <div>
                    <h2>Arquivo Selecionado</h2>
                    <div className='input-line'>
                        <input
                            type="text"
                            className='line-input'
                            value={selectedName}
                            onChange={e => setSelectedName(e.target.value)}
                        />
                        <button type="button" className='trash' onClick={handleFileRemove}>
                            <DeleteIcon style={{ color: 'white' }} />
                        </button>
                        <button type="button" className='submit' onClick={handleFileSubmit}>
                            Enviar
                        </button>
                    </div>
                </div>
            </div>
            {/* Segunda Caixa */}
            <div className='inner-box'>
                <h2>Escolha um Arquivo</h2>
                {/* Loop que cria os componentes pela quantidade de itens dos testes */}
                <div style={{ overflow: 'scroll' }}>
                    {getFiles.map((file, index) => (
                        <EyeCard key={index} file={file} callFunction={abrirModal} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
}
export default InputSection;