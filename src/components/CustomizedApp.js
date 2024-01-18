import React, { useState, useEffect } from "react";
import SendBirdCall from "sendbird-calls";
import {
  withSendBird,
  Channel as SBConversation,
  ChannelList as SBChannelList,
  ChannelSettings as SBChannelSettings,
} from "sendbird-uikit";
import CustomChannelListHeader from "./CustomChannelListHeader";

function CustomizedApp(props) {
  const [userGroup, setUserGroup] = useState({});
  const [callee, setCallee] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [call, setCall] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [mutedVideo, setMutedAudio] = useState(false);
  const [defaultCallParams, setDefaultCallParams] = useState({});

  const {
    config: { userId },
  } = props;

  const [currentChannelUrl, setCurrentChannelUrl] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const [query, setQuery] = useState({
    channelListQuery: {
      includeEmpty: true,
      channelNameContainsFilter: "",
    },
  });

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const filterGroup = props.groupChannels.filter(
      (item) => item.url === currentChannelUrl
    );
    setUserGroup(filterGroup);
  }, [currentChannelUrl, props.groupChannels]);

  useEffect(() => {
    console.log("============userGroup", userGroup);
    if (userGroup && userGroup.length > 0) {
      const members = userGroup[0]?.members;

      if (members && members.length > 0) {
        const calleeFilter = members.filter((item) => item.userId !== userId);
        if (calleeFilter.length > 0) {
          const calleee = calleeFilter[0].userId;
          setCallee(calleee);
        } else {
          console.warn("No other members found in userGroup");
        }
      } else {
        console.warn("No members found in userGroup[0]");
      }
    } else {
      console.warn("userGroup is undefined or empty");
    }
  }, [userGroup, userId]);

  const initiateSendbirdCalls = async () => {
    try {
      setLoading(true);
      addEventHandler();
      setAuthenticated(true);
      setLoading(false);
    } catch {
      setLoading(false);
      setAuthenticated(false);
    }
  };

  const setDefaultCallHandlers = (call) => {
    console.log("==calllll", call);
    call.onEstablished = () => {
      setRinging(false);
      setConnecting(false);
      console.log("Call established");
    };
    call.onConnected = () => {
      setRinging(false);
      setConnected(true);
      setConnecting(false);
      console.log("Call connected");
      console.log(call);
    };
    call.onReconnected = () => {
      setConnected(true);
      setConnecting(false);
      console.log("Call reconnected");
    };
    call.onReconnecting = () => {
      setConnected(false);
      setConnecting(true);
      console.log("Call reconnecting");
    };
    if (!call.isAccepted) {
      call.onEnded = () => {
        setRinging(false);
        setConnected(false);
        setConnecting(false);
        setCall(null);
        console.log("Call ended");
        closeModal();
      };
    }
    call.onRemoteAudioSettingsChanged = () => {
      console.log("Remote audio settings changed");
    };
    call.onRemoteVideoSettingsChanged = () => {
      console.log("Remote video settings changed");
    };
    return call;
  };

  const addEventHandler = () => {
    SendBirdCall.addListener(`CALLS_HANDLER_${userId}`, {
      onRinging: (call) => {
        console.log("Receiving call");
        call = setDefaultCallHandlers(call);
        setRinging(true);
        setCall(call);
        openModal();
      },
    });
  };

  useEffect(() => {
    if (userId) {
      initiateSendbirdCalls();
      setDefaultCallParams({
        callOption: {
          localMediaView: document.getElementById("local_video_element_id"),
          remoteMediaView: document.getElementById("remote_video_element_id"),
          audioEnabled: true,
          videoEnabled: true,
        },
      });
    }
  }, [userId]);

  const makeCall = ({ userId, isVideoCall }) => {
    console.log("callee userid", userId);
    const dialParams = { ...defaultCallParams, ...{ userId, isVideoCall } };
    console.log("==dialparams", dialParams);
    let call = SendBirdCall.dial(dialParams, (call, error) => {
      console.log("Dialing");
      if (error) {
        setCall(null);
      }
    });

    call = setDefaultCallHandlers(call);
    console.log("===cccc", call);
    setConnecting(true);
    setCall(call);
    openModal();
  };

  return (
    <div className="customized-app">
      <div className="sendbird-app__wrap">
        <div className="sendbird-app__channellist-wrap">
          <CustomChannelListHeader
            setChannelUrl={(url) => {
              setCurrentChannelUrl(url);
            }}
            onSetQuery={setQuery}
            allUsers={props.allUsers}
            userId={userId}
          />

          <SBChannelList
            onChannelSelect={(channel) => {
              if (channel && channel.url) {
                setCurrentChannelUrl(channel.url);
              } else {
                setCurrentChannelUrl("");
              }
            }}
            queries={query}
          />
        </div>
        <div
          className="sendbird-app__conversation-wrap"
          style={{ position: "relative" }}
        >
          <SBConversation
            channelUrl={currentChannelUrl}
            onChatHeaderActionClick={() => {
              setShowSettings(true);
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "0",
              right: "50px",
              height: "17vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => makeCall({ userId: callee, isVideoCall: false })}
          >
            <img
              src={`${process.env.PUBLIC_URL}/assets/images/call.svg`}
              alt="callIcon"
              style={{ width: "25px" }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              top: "0",
              right: "85px",
              height: "17vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => makeCall({ userId: callee, isVideoCall: true })}
          >
            <img
              src={`${process.env.PUBLIC_URL}/assets/images/video.svg`}
              alt="videoIcon"
              style={{ width: "25px" }}
            />
          </div>
        </div>
        {showSettings && (
          <div className="sendbird-app__settingspanel-wrap">
            <SBChannelSettings
              channelUrl={currentChannelUrl}
              onCloseClick={() => {
                setShowSettings(false);
              }}
            />
          </div>
        )}
        <div>
          {isModalOpen && (
            <div id="myModal" className="modal">
              <div
                className="modal-content"
                style={{
                  height: "15vh",
                }}
              >
                <span className="close" onClick={closeModal}>
                  &times;
                </span>
                <div className="p-10">
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                  </div>
                  <div className="flex justify-center mt-28">
                    <>
                      {userId && (
                        <>
                          <div className="flex flex-col items-center space-y-6">
                            {authenticated && ringing && (
                              <div className="flex flex-col items-center space-y-3">
                                <h2 className="text-lg">
                                  {call.isVideoCall ? "Video" : "Audio"} Call is
                                  Ringing
                                </h2>
                                <div className="flex space-x-4">
                                  <button
                                    onClick={() => {
                                      call.end();
                                      setRinging(false);
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                                    style={{cursor:"pointer"}}
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRinging(false);
                                      let acceptedCall =
                                      setDefaultCallHandlers(call);
                                      acceptedCall.accept(defaultCallParams);
                                      setCall(acceptedCall);
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                                    style={{cursor:"pointer"}}
                                  >
                                    Accept
                                  </button>
                                </div>
                              </div>
                            )}

                            {authenticated && connected && (
                              <div className="flex flex-col items-center space-y-3">
                                <h2>
                                  {call.isVideoCall ? "Video" : "Audio"} Call is
                                  Connected
                                </h2>
                                <div className="flex space-x-4">
                                  <button
                                    onClick={() => {
                                      setMuted(!muted);
                                      call.isLocalAudioEnabled
                                        ? call.muteMicrophone()
                                        : call.unmuteMicrophone();
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                                    style={{cursor:"pointer"}}
                                  >
                                    {call.isLocalAudioEnabled
                                      ? "Mute Audio"
                                      : "Unmute Audio"}
                                  </button>
                                  {call.isVideoCall && (
                                    <button
                                      onClick={() => {
                                        setMutedAudio(!mutedVideo);
                                        call.isLocalVideoEnabled
                                          ? call.stopVideo()
                                          : call.startVideo();
                                      }}
                                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
                                    style={{cursor:"pointer"}}
                                    >
                                      {mutedVideo
                                        ? "Enable Video"
                                        : "Disable Video"}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => call.end()}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                                    style={{cursor:"pointer"}}
                                  >
                                    End Call
                                  </button>
                                </div>
                              </div>
                            )}

                            {authenticated && connecting && (
                              <div className="flex items-center space-x-2">
                                <div className="bg-green-400 w-[50px] h-[50px] flex justify-center items-center rounded-full">
                                  <div className="animate-spin rounded-full h-[20px] w-[20px] border-b-2 border-white"></div>
                                </div>
                                <div>Calling...</div>
                              </div>
                            )}
                            {typeof window !== "undefined" && (
                              <div className="relative h-[700px] w-screen flex rounded-md">
                                <video
                                  className="absolute top-0 left-0 object-cover z-1 w-[400px] h-[250px] rounded-md"
                                  id="remote_video_element_id"
                                  autoPlay={true}
                                  visible={call?.isVideoCall}
                                  style={
                                    call?.isVideoCall
                                      ? { width: "100%" }
                                      : { width: "0%" }
                                  }
                                />
                                <video
                                  className="absolute top-0 left-0 object-cover z-1 w-[400px] h-[50px] rounded-md"
                                  id="local_video_element_id"
                                  autoPlay={true}
                                  visible={call?.isVideoCall}
                                  style={
                                    call?.isVideoCall
                                      ? { width: "30%" }
                                      : { width: "0%" }
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default withSendBird(CustomizedApp);
