import React from 'react'

const ViewersListItem = ({ viewer, removeViewer }) => {
    return (
        <div className="collaborators-div" >
            <div className="username-div" >
                <p>{viewer.username}</p>
            </div>
            <span className="material-icons remove-btn"
                onClick={
                    () => {
                        removeViewer(viewer)
                    }
                }
            >close</span>
        </div>
    )
}

export default ViewersListItem
