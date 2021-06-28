import React from 'react'

const DocListItem = ({ doc, currentUser, viewDocHandler, manageDocumentHandler, deleteDocHandler }) => {
    return (
      
        <tbody>
        <tr>
          <td>{doc.name}</td>
          
          {doc.collaborators.includes(currentUser._id) ? (
            <td>Collaborator</td>
          ) : (
            <td>Owner</td>
          )}
          <td>
            <button
              className='ui secondary button'
              onClick={id => viewDocHandler(doc._id)}
            >
              EDIT
            </button>
          </td>
          {doc.collaborators.includes(currentUser._id) ? (
              <td>
              <button
                  className='ui disabled secondary button'
              >
                  settings
              </button>
          </td>
          ) : (
                <td className='buttons--div'>
                    <button
                        className='ui secondary button'
                        onClick={id => manageDocumentHandler(doc._id)}
                    >
                        settings
                    </button>
                </td>
          )}
          {doc.collaborators.includes(currentUser._id) ? (
              <td> 
              <button
              className='ui disabled secondary button'
            >
              Delete
            </button>
          </td>
          ) : (
            <td> 
            <button
            className='ui secondary button'
            onClick={id => deleteDocHandler(doc._id)}
          >
            Delete
          </button>
          </td>
          )}
        </tr>
      </tbody>
    )
}

export default DocListItem
