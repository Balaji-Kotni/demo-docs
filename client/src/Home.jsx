import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import './Home.css'
import AuthContext from './context/AuthContext'
import { useHistory } from 'react-router'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import DocListItem from './components/DocListItem/DocListItem'

const Home = (props) => {
    const [title, setTitle] = useState("")
    const [docs, setDocs] = useState([])
    const [errorMessage, setErrorMessage] = useState("")

    const [loading, setLoading] = useState(true)

    const { currentUser } = useContext(AuthContext)

    const history = useHistory()

    const clickHandler = async () => {
        async function createNewDoc() {
            try {
                const newDoc = await axios.post('/api/docs', {
                    name: title
                }, { withCredentials: true })

                const docId = newDoc.data.data.doc._id
                return docId
            } catch (err) {
                setErrorMessage(err.response.data.message)
            }
        }


        const docId = await createNewDoc()

        if (docId) {
            const docIdString = `id=${docId}`

            props.history.push({
                pathname: "/new",
                search: docIdString,
            })
        }
    }

    async function getAllDocs() {
        const docs = await axios.get('/api/docs')

        setDocs(docs.data.data.docs)
        setLoading(false)
    }

    useEffect(() => {
        getAllDocs()
    }, [])

    const viewDocHandler = (id) => {
        const idString = `id=${id}`

        props.history.push({
            pathname: '/view',
            search: idString,
        })
    }

    const deleteDocHandler = async (id) => {
        try {
            await axios.delete(`/api/docs/${id}`)

            // props.history.push({
            //     pathname: "/delete"
            // })

            getAllDocs()

            toast.error("Document Deleted!", {
                position: toast.POSITION.TOP_LEFT,
                autoClose: 2000
            })

        } catch (err) {
            console.log(err)
        }
    }

    const manageDocumentHandler = (id, title, collaborators) => {
        history.push({
            pathname: '/manage',
            state: {
                id,
                title,
                collaborators
            }
        })

    }

    return (
        <>

            {
                loading === true
                    ? <div className="ui active dimmer">
                    <div className="ui large text loader">Loading..</div>
                  </div>
                    : null
            }

            {
                loading === false ? (
                    
                    <div className="dashboard-container" >

                        <div className="new-doc" style={{padding:"50px"}} >

                        <div className="ui placeholder segment">
                        <div className="ui icon header">
                            <i className="pdf file outline icon"></i>
                            <div className="ui form">
                                <div className="field">
                                    <label>Title</label>
                                    <input type="text" placeholder="Enter title of the document"
                                    onChange={(e) => {
                                        setTitle(e.target.value)
                                    }} />
                                </div>
                                {
                                        errorMessage !== "" && <div className="ui error message">
                                        <div className="header">Action Forbidden</div>
                                        <p>{errorMessage}</p>
                                    </div>
                                }
                                
                                <div className="ui submit button" onClick={
                                        (e) => {
                                            e.preventDefault()
                                            clickHandler()
                                        }
                                    }
                                    disabled={!title}>Add Docment</div>
                            </div>
                        </div>
                    </div>
                        </div>
                    </div>

                )
                    : null
            }

            {
                loading === false ?
                    (
                        <div className="docs-list" style={{padding:"50px"}}>
                            <table class='ui fixed table' >
                            <thead>
                                <tr>
                                <th>Name</th>
                                <th>Owner/Colabrator</th>
                                <th>Edit</th>
                                <th>Settings</th>
                                <th>Delete</th>
                                </tr>
                            </thead>
                            {
                                docs.map((doc, index) => {
                                    return (
                                        <DocListItem 
                                            key={index} 
                                            doc={doc} 
                                            currentUser={currentUser}
                                            viewDocHandler={viewDocHandler}
                                            manageDocumentHandler={manageDocumentHandler}
                                            deleteDocHandler={deleteDocHandler}
                                        />
                                    )
                                })
                            }
                            </table>
                            </div>
                    )
                    : null
            }
        </>
    )
}

export default Home