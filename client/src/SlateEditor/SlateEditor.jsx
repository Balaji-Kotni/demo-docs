import React, { useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { createEditor, Editor, Transforms, Element as SlateElement } from 'slate'
import { Slate, Editable, withReact, useSlate ,} from 'slate-react'
import Elements from './Elements'
import './SlateEditor.css'
import Leaf from './Leaf'
import Button from './Buttons/Button'
import axios from 'axios'
import AuthContext from '../context/AuthContext'
import { Redirect } from 'react-router'
import socketIoClient from 'socket.io-client'
import { withHistory, History,HistoryEditor } from 'slate-history'

const socket = socketIoClient()

const SlateEditor = (props) => {

  const queryParams = new URLSearchParams(props.location.search)
  let idCopy;
  for (let param of queryParams.entries()) {
    if (param[0] === 'id') {
      idCopy = param[1]
    }
  }
  const [docId] = useState(idCopy)
  const [title, setTitle] = useState("")
  const [read, setRead] = useState("False")
  const [usertype, setUsertype] = useState("")
  const [idStatus, setIdStatus] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [errorStatus, setErrorStatus] = useState("")
  const [colabrators, setColabrators] = useState([])
  const [viewers, setViewers] = useState([])
  const [ownerCheck, setownerCheck] = useState("")
  const [UserData, setUserData] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const editor = useMemo(() => withReact(createEditor()), [])
  const [value, setValue] = useState([])

  const [timer, setTimer] = useState()

  const [saved, setSaved] = useState()

  const { loggedIn } = useContext(AuthContext)

  const id = useRef(Date.now().toString() + "::UID")
  
  useEffect(() => {
    if (loggedIn) {
      if (!idCopy) {
        setIdStatus("false")
      } else {
        async function getSingleDoc() {
          try {
            const doc = await axios.get(`/api/docs/${docId}`)
            setValue(doc.data.data.doc.content)
            setTitle(doc.data.data.doc.name)
            setColabrators(doc.data.data.doc.collaborators)
            setViewers(doc.data.data.doc.viewers)
            setownerCheck(doc.data.data.doc.owner)
            setSaved(true)

            
          } catch (err) {
            setErrorStatus(err.response.status)
            setErrorMessage(err.response.data.message)
          }
        }

        getSingleDoc()
        socket.on('new-remote-operations', ({ editorId, operations, documentId }) => {
          if (editorId !== id.current && documentId === docId) {
            Editor.withoutNormalizing(editor, () => {
              operations.forEach(operation => {
                if (editor !== null) {
                  editor.apply(operation)
                } else {
                  console.log("its null!")
                }
              })
            })
          }
        })
      }
    }

  }, [docId])
  const renderElement = useCallback(props => {

    if (props.element.type === "heading-one") {
      return <Elements {...props} />
    }
    if (props.element.type === "heading-two") {
      return <Elements {...props} />
    } else {
      return <Elements {...props} />
    }

  }, [])
  
  const renderLeaf = useCallback(props => {
    return <Leaf {...props} />

  }, [])

  const saveDocHandler = (value) => {
    
    async function saveDoc() {

      try {
        await axios.patch(`/api/docs/${docId}`, {
          content: value
        })
        setSaved(true)
      } catch (err) {
        setErrorStatus(err.response.status)
        setErrorMessage(err.response.data.message)
      }
    }
    saveDoc()
  }

  async function getUserData() {
    const response = await axios.get('/api/users/isLoggedIn', { withCredentials: true })
    setUserData(response.data.user._id)
    setLoading(false)
  }
  useEffect(() => {
    getUserData()

  }, [])
  
  
  
  return (
    <div className="ui grid">
      {
                loading === true
                    ? <div className="ui active dimmer">
                    <div className="ui large text loader">Loading..</div>
                  </div>
                    : null
      }
      <div className="ten wide column" >
      <div className="base-div" >
      
      {
        loggedIn && errorMessage === "You are not authorised to access this document!"
          ? <Redirect to={{ pathname: "/permission", state: { message: errorMessage, docId } }} />
          : console.log('first condition')
      }

      {
        (loggedIn && errorMessage !== "You are not authorised to access this document!" && errorMessage !== "")
          ? <Redirect to={{ pathname: "/error", state: { message: errorMessage, statusCode: errorStatus } }} />
          : console.log('condition 2')
      }

      {
        loggedIn && idStatus === "false" ? <Redirect to="/" /> : null
      }

      {
        loggedIn ? null : <Redirect to="/login" />
      }
      
      
      <div className="doc-info" >
        <h3 className="doc-title" >{title}</h3>

        <div>
          {
            saved
              ? <p style={{ color: "green" }} >Saved</p>
              : <p></p>
          }
        </div>

        <button
          disabled={!value}
          className="save-button"
          onClick={() => saveDocHandler(value)}
        >
          <span className="material-icons" >
            save
          </span>
        </button>
        {/* <button
          onClick={() => viewer() }
        >
          <span className="material-icons" >
            getcontributors
          </span>
        </button> */}

      </div>

      <Slate editor={editor} value={value} onChange={
        
        (value) => {
          setValue(value)
          //setSaved(false)

          //console.log(editor.operations)
          editor.operations.forEach(
            operation => {
              if (operation.type !== "set_selection" && operation.type !== "set_value") {
                //console.log("performed")
                const saveState = () => {
                  if (saved) {
                    setSaved(false)
                    //console.log("saved: false")
                  }
                }

                saveState()
                
              }
            }
          )


          const filterOps = editor.operations.filter(o => {
            // console.log(o)
            if (o === null) {
              //console.log("this was null")
              return false
            }

            const is_sourced = (o.data != null) && ("source" in o.data)
            return (
              o.type !== "set_selection" &&
              o.type !== "set_value" &&
              (!is_sourced)
            )

          })
            .map(o => ({ ...o, data: { source: "one" } }))

          //console.log(filterOps)
          if (filterOps.length > 0) {
            socket.emit("new-operations", {
              editorId: id.current,
              operations: filterOps,
              documentId: docId
            })
            console.log(filterOps)
          }

        }
      }
      >

        <div className="toolbar" >

          <MarkButton format="bold" icon="format_bold"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer} />

          <MarkButton format="italic" icon="format_italic"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />

          <MarkButton format="underline" icon="format_underline"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />

          <MarkButton format="code" icon="code"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />

          <MarkButton format="uppercase" icon="keyboard_arrow_up"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />

          <MarkButton format="lowercase" icon="keyboard_arrow_down"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />


          <BlockButton format="heading-one" icon="looks_one"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />

          <BlockButton format="heading-two" icon="looks_two"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />

          <BlockButton format="left" icon="format_align_left"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />

          <BlockButton format="center" icon="format_align_center"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />

          <BlockButton format="right" icon="format_align_right"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />

          <BlockButton format="justify" icon="format_align_justify"
            saveDoc={saveDocHandler}
            timer={timer}
            setTimer={setTimer}
          />

        </div>
        {
          viewers.includes(UserData) ? (
            <Editable
            readOnly
          renderElement={renderElement}
          renderLeaf={renderLeaf}

          onKeyUp={
            () => {
              if (timer) {
                window.clearTimeout(timer)
              }

              setTimer(setTimeout(() => {
                //console.log("done")
                saveDocHandler(value)
              }, 1000))

            }
          }

          onKeyPress={
            () => {
              if (timer) {
                window.clearTimeout(timer)
              }
              //console.log("typing")
            }
          }


          onKeyDown={event => {

            if (!event.ctrlKey) {
              return
            }

            switch (event.key) {

              case 'b':
                event.preventDefault()
                toggleMark(editor, "bold")
                break

              case 'i':
                event.preventDefault()
                toggleMark(editor, "italic")
                break

              case 'u':
                event.preventDefault()
                toggleMark(editor, "underline")
                break

              case '`':
                event.preventDefault()
                toggleMark(editor, "code")
                break

              default: break

            }
          }}
        />
          ) : (
            <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}

          onKeyUp={
            () => {
              if (timer) {
                window.clearTimeout(timer)
              }

              setTimer(setTimeout(() => {
                //console.log("done")
                saveDocHandler(value)
              }, 1000))

            }
          }

          onKeyPress={
            () => {
              if (timer) {
                window.clearTimeout(timer)
              }
              //console.log("typing")
            }
          }


          onKeyDown={event => {

            if (!event.ctrlKey) {
              return
            }

            switch (event.key) {

              case 'b':
                event.preventDefault()
                toggleMark(editor, "bold")
                break

              case 'i':
                event.preventDefault()
                toggleMark(editor, "italic")
                break

              case 'u':
                event.preventDefault()
                toggleMark(editor, "underline")
                break

              case '`':
                event.preventDefault()
                toggleMark(editor, "code")
                break

              default: break

            }
          }}
        />
          )
        }
        
        
        
      </Slate>
    </div>
      </div>
      <div className="six wide column">
      <div className="base-changelog-div" >
          <h1>{console.log(value)}</h1>
      </div>
      </div>
    </div>
    
  )
}

const MarkButton = ({ format, icon, saveDoc, timer, setTimer }) => {
  const editor = useSlate()
  
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={(e) => {
        e.preventDefault()
        toggleMark(editor, format)
        if (timer) {
          window.clearTimeout(timer)
        }

        setTimer(setTimeout(() => {
          saveDoc(editor.children)
        }, 1000))

      }}

      icon={icon}
    />
  )
}

const BlockButton = ({ format, icon, saveDoc, timer, setTimer }) => {
  const editor = useSlate()
  return (
    <Button
      active={isBlockActive(editor, format)}
      onMouseDown={(e) => {
        e.preventDefault()
        toggleBlock(editor, format)
        if (timer) {
          window.clearTimeout(timer)
        }

        setTimer(setTimeout(() => {
          saveDoc(editor.children)
        }, 1000))
      }}
      icon={icon}
    />
  )
}

const isMarkActive = (editor, format) => {
  let marks = Editor.marks(editor)
  let returnValue = marks ? marks[format] === true : false
  return returnValue
}

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }

}

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(
    editor,
    {
      match: node => {
        return !Editor.isEditor(node) && SlateElement.isElement(node) && node.type === format
      }
    }
  )

  return !!match
}

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format)

  Transforms.setNodes(
    editor,
    { type: isActive ? 'paragraph' : format },
    { match: node => Editor.isBlock(editor, node) }
  )
}


export default SlateEditor;