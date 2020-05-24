import React, { Component } from 'react';
import { uniqueId } from 'lodash'; //Para gerar ID único
import filesize from 'filesize';  //Para controlar a nomenclatura do tamanho de uma imagem

import api from './services/api';

import GlobalStyle from './styles/global';
import { Container, Content } from './styles';

import Upload from './components/Upload';
import FileList from './components/FileList';

class App extends Component {
  // const [uploadedFiles, arrayFiles] = useState([]);
  state = {
    uploadedFiles: [],
  };

  async componentDidMount() {
    const response = await api.get('uploads');

    this.setState({
      uploadedFiles: response.data.map(file => ({
        id: file._id,
        name: file.name,
        readableSize: filesize(file.size),
        preview: file.url,
        uploaded: true,
        url: file.url,
      }))
    })
  }

  handleUpload = files => {
    const uploadedFiles = files.map(file => ({  //criando um array de objetos
      file,
      id: uniqueId(),
      name: file.name,
      readableSize: filesize(file.size),
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      error: false,
      url: null,
    }))

    this.setState({
      uploadedFiles: this.state.uploadedFiles.concat(uploadedFiles)
    });

    uploadedFiles.forEach(this.processUpload);
  };

  updateFile = (id, data) => {
    this.setState({ uploadedFiles: this.state.uploadedFiles.map(uploadedFile => 
      {
        return id === uploadedFile.id 
          ? {...uploadedFile, ...data } 
          : uploadedFile;
      })
    });
  }

  processUpload = (uploadedFile) => {
    /**
     * A ideia é criar um objeto de formulário, quando o HTML passa os dados de
     * um formulário para o JS ele fica nesse formato (do objeto FormData)
     */
    const data = new FormData();

    data.append('file', uploadedFile.file, uploadedFile.name);

    api
      .post('uploads', data, {
        onUploadProgress: e => {
          const progress = parseInt(Math.round((e.loaded * 100) / e.total));
        
          this.updateFile(uploadedFile.id, {
            progress,
          })
        }
      })
      .then(response => {
        this.updateFile(uploadedFile.id, {
          uploaded: true,
          id: response.data._id, //underline é por causa do mongoDB, ele salva os dados assim
          url: response.data.url
        });
      })
      .catch(() => {
        this.updateFile(uploadedFile.id, {
          error: true
        });
      });
  }

  handleDelete = async id => {
    await api.delete(`uploads/${id}`);

    this.setState ({
      uploadedFiles: this.state.uploadedFiles.filter(file => file.id !== id),
    });
  }

  componentWillUnmount() {
    this.state.uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }

  render(){
    const { uploadedFiles } = this.state;

    return (
      <>
        <Container>
          <Content>
            <Upload onUpload={this.handleUpload} />
            {/** Para retornar o componente da lista, primeiro haverá uma
             * verificação para averiguar se na lista (UploadedFiles), tem mais
             * de 0 itens.
             * 
             * Utilizando o !! ao inves de retornar a quantidade de itens, retorna
             * TRUE para > 0 itens e FALSE para = 0 itens na lista
             */
             
              !!uploadedFiles.length && (
                <FileList 
                  files={uploadedFiles}
                  onDelete={this.handleDelete}/>
              )
             }

          </Content>
          <GlobalStyle />
        </Container>
      </>
    );
  }
}

export default App;
