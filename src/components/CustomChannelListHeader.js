import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { withSendBird, sendBirdSelectors } from "sendbird-uikit";

function CustomChannelListHeader(props) {
  const [channelName, setChannelName] = useState("");
  const [selectedUser, setSelectedUser] = useState(props.userId);
  const {
    createChannel,
    sdk,
    setChannelUrl,
    onSetQuery
  } = props;
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setChannelName("");
    setSelectedUser("");
    setOpen(false);
  };

  return (
    <>
      <div className="custom-channel-list">
        Channels
        <div>
          <Button variant="contained" color="primary" onClick={handleClickOpen}>
            Create
          </Button>
        </div>
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Select users</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Type Channel Name
              <div>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                />
              </div>

              <div>
                <label style={{display:"block"}}>Select User:</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{width:"100%"}}
                >
                  {props.allUsers.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.userId}
                    </option>
                  ))}
                </select>
              </div>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                let params = new sdk.GroupChannelParams();
                params.isPublic = false;
                params.isEphemeral = false;
                params.isDistinct = true;
                params.addUserIds([selectedUser]); 
                params.name = channelName;
                createChannel(params)
                  .then((c) => {
                    setChannelUrl(c.url);
                  })
                  .catch((c) => console.warn(c));
                handleClose();
              }}
              color="primary"
              autoFocus
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </div>
      <div>
        <input
          onChange={(e) => {
            onSetQuery({
              channelListQuery: {
                channelNameContainsFilter: e.target.value
              }
            });
          }}
          placeholder="search channel"
        />
      </div>
    </>
  );
}

export default withSendBird(CustomChannelListHeader, (state) => {
  return {
    createChannel: sendBirdSelectors.getCreateChannel(state),
    sdk: sendBirdSelectors.getSdk(state)
  };
});
