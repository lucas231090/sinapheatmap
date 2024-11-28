# Plataforma do SINAPHEATMAP

O **SINAPHEATMAP** é uma plataforma desenvolvida para auxiliar pesquisadores no monitoramento e visualização de dados provenientes de experimentos com o sistema de **eyetracking**.

## Funcionalidades

Com o SINAPHEATMAP é possível:

- Fazer o upload de arquivos **CSV** contendo dados gerados por experimentos de eyetracking.
- Enviar mídias associadas ao experimento, como imagem ou vídeo.
- Gerar visualizações na forma de **heatmaps**, permitindo ajustar a dimensão (em pixels) da exibição para diferentes tamanhos de tela.
- Realizar o download das mídias com o heatmap sobreposto, facilitando o compartilhamento e análise.

### Estrutura da Aplicação

O sistema é composto por duas partes principais: **back-end** e **front-end**. Cada uma delas está organizada em diretórios separados dentro do repositório:

- **`be/`**: Contém a API REST, desenvolvida com o framework **Express**, responsável por gerenciar a lógica da aplicação e comunicação com o banco de dados.
- **`fe/`**: Contém o front-end, desenvolvido com **React**, que fornece uma interface web interativa para os usuários.

Cada diretório possui seu próprio arquivo `README.md`, onde você encontrará instruções para configuração e execução de suas respectivas partes.
