import React, { useEffect, useState } from "react";
import SendBirdCall from "sendbird-calls";
import { SendBirdProvider as SBProvider } from "sendbird-uikit";
import SendBird from "sendbird";
import CustomizedApp from "./components/CustomizedApp";
import "sendbird-uikit/dist/index.css";
import "../src/App.css";

const APP_ID = "BFC35E0F-FC58-4268-901A-83995F8DC01B";
const sb = new SendBird({ appId: APP_ID });
const App = () => {
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState({});
  const [allUsers, setAllusers] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [groupChannels, setGroupChannels] = useState([]);

  const handleAuthentication = (e) => {
    setUserId(e.target.value);
  };

  const authenticateUser = async () => {
    if (userId) {
      SendBirdCall.init(APP_ID);
      try {
        // Connect to SendBird Chat SDK
        const user = await sb.connect(userId);
        console.log("User authenticated:", user);
        setUser(user);

        // Initialize SendBird Call SDK
        await authenticateCall();
        await SendBirdCall.connectWebSocket();

        // fetch all users
        const queryParams = {
          limit: 20,
        };
        const query = sb.createApplicationUserListQuery(queryParams);

        const users = await query.next();
        console.log("===usersssss",users)
        setAllusers(users);

        // Fetch group channels using GroupChannelListQuery
        const channelsQuery = sb.GroupChannel.createMyGroupChannelListQuery();

        channelsQuery.limit = 30;
        channelsQuery.includeEmpty = true;
        const channels = await channelsQuery.next();
        setGroupChannels(channels);

        channels.forEach((groupChannel) => {
          const channelUrl = groupChannel.url;
          const channelName = groupChannel.name;
          const profileUrl = groupChannel.coverUrl;
          console.log("Group Information:", {
            channelUrl,
            channelName,
            profileUrl,
          });
        });

        setIsAuthenticated(true);
      } catch (error) {
        console.error("SendBird authentication failed:", error);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  };

  const authenticateCall = async () => {
    try {
      const result = await new Promise((resolve, reject) => {
        SendBirdCall.authenticate({ userId }, (res, error) => {
          if (error) {
            reject(error);
          } else {
            resolve(res);
          }
        });
      });
      console.log(`Authenticated as ${userId}`);
      return result;
    } catch (error) {
      console.log("Error authenticating");
      throw error;
    }
  };

  useEffect(() => {
    console.log("GroupChannels updated:", groupChannels);
  }, [groupChannels]);

  useEffect(() => {
    console.log("userInfo", user);
  }, [user]);

  return (
    <div className="App">
      {!isAuthenticated ? (
        <>
          <div>Authenticate with Sendbird</div>
          <div>
            <input
              type="text"
              placeholder="Enter user id"
              value={userId}
              onChange={handleAuthentication}
            />
            <button onClick={authenticateUser} style={{ cursor: "pointer" }}>
              Connect
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ position: "relative", height: "100vh" }}>
            <SBProvider appId={APP_ID} userId={userId} nickname={user.nickname}>
              <CustomizedApp userInfo={user} groupChannels={groupChannels} allUsers={allUsers}
              />
            </SBProvider>
          </div>
          <div></div>
        </>
      )}
    </div>
  );
};
export default App;
