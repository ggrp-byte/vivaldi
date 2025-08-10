import { addWebUiListener } from "chrome://resources/js/cr.js";
import { loadTimeData } from "chrome://resources/js/load_time_data.js";
window.loadTimeData = loadTimeData;
let next_message_id_ = 100000;
const response_map_ = new Map();
/* TODO: Localize */
const xmlns = "http://www.w3.org/2000/svg";
const userSVG =
  "M10 20c5.523 0 10-4.477 10-10S15.523 0 10 0 0 4.477 0 10s4.477 10 10 10Zm5.68-4.366A7.976 7.976 0 0 1 10 18c-2.22 0-4.23-.905-5.68-2.366C5.244 13.295 6.96 12 7.93 12h4.142c.97 0 2.686 1.295 3.608 3.634Zm-2.347-8.467a3.333 3.333 0 1 1-6.666 0 3.333 3.333 0 0 1 6.666 0Z";

addWebUiListener("vivaldi-ui-response", resp => {
  response_map_[resp.callbackId](resp.response);
  response_map_.delete(resp.callbackId);
});

function sendWithResponse(messageId, args, callback) {
  next_message_id_++;
  response_map_[next_message_id_] = callback;
  // eslint-disable-next-line no-undef
  chrome.send(messageId, [next_message_id_, args]);
}

function showProfiles() {
  const pageTitle = loadTimeData.getString("whoIsUsing");
  const introText = loadTimeData.getString("introText");
  const guestMode = loadTimeData.getString("guestMode");
  const showOnStartup = loadTimeData.getString("onStartup");

  document.title = pageTitle;
  sendWithResponse("getProfilesInfo", {}, response => {
    // Root
    const portal = document.querySelector(".ProfilePicker");

    // Vivaldi logo
    const logo = document.createElement("img");
    logo.width = 68;
    logo.height = 68;
    logo.className = "logo";
    logo.src = "welcomepage-vivaldi.svg";
    portal.appendChild(logo);

    // Heading
    const h1 = document.createElement("h1");
    h1.innerText = pageTitle;
    portal.appendChild(h1);

    // Intro paragraph
    const intro = document.createElement("p");
    intro.innerText = introText;
    portal.appendChild(intro);

    // Profile button list
    const wrapper = document.createElement("div");
    wrapper.className = "ProfilePicker-List";
    response.profiles
      .sort((a, b) => a.path.localeCompare(b.path))
      .forEach(item => {
        // Profile button wrapper
        const button = document.createElement("button");
        button.className = "ProfilePicker-Profile";
        button.onclick = () => {
          sendWithResponse("pickProfile", { path: item.path }, resp => {});
        };
        // Editable name input
        const name = document.createElement("input");
        name.type = "text";
        name.value = item.name || item.path.split("/").at(-1);
        name.onclick = event => {
          event.preventDefault();
          event.stopPropagation();
        };
        // TODO: hook up profile renaming and enable
        name.style.pointerEvents = "none";
        name.onchange = event => {};
        // Profile avatar icon
        const url = item.avatar;
        const img = document.createElement("img");
        img.className = "ProfilePicker-Avatar";
        img.src = url;
        button.appendChild(name);
        button.appendChild(img);
        wrapper.appendChild(button);
      });
    portal.appendChild(wrapper);

    // Profile controls
    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "ProfilePicker-Controls";

    // Guest mode button
    const guestButton = document.createElement("button");
    guestButton.onclick = () => {
      sendWithResponse("pickProfile", {}, resp => {});
    };
    const userImage = document.createElementNS(xmlns, "svg");
    userImage.setAttributeNS(null, "width", 20);
    userImage.setAttributeNS(null, "height", 20);
    const userImagePath = document.createElementNS(xmlns, "path");
    userImagePath.setAttributeNS(null, "fill", "currentColor");
    userImagePath.setAttributeNS(null, "fill-rule", "evenodd");
    userImagePath.setAttributeNS(null, "d", userSVG);
    userImage.appendChild(userImagePath);
    guestButton.appendChild(userImage);
    const userText = document.createElement("span");
    userText.innerText = guestMode;
    guestButton.appendChild(userImage);
    guestButton.appendChild(userText);
    buttonWrapper.appendChild(guestButton);

    // Show on startup
    const startupLabel = document.createElement("label");
    const inputBox = document.createElement("input");
    inputBox.type = "checkbox";
    inputBox.checked = response.showOnStartup;
    inputBox.onchange = () => {
      sendWithResponse(
        "setShowOnStartup",
        { value: inputBox.checked },
        response => {},
      );
    };
    const inputText = document.createElement("span");
    inputText.innerText = showOnStartup;
    startupLabel.appendChild(inputBox);
    startupLabel.appendChild(inputText);
    buttonWrapper.appendChild(startupLabel);
    portal.insertAdjacentElement("afterend", buttonWrapper);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  showProfiles();
});
