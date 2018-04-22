/*
const config = {};
config.username = "justinfan12345"; // username
config.oauth = "oauth:kappa"; // oauth
config.channel = "mobilmobil"; // channel
config.wsUri = "wss://irc-ws.chat.twitch.tv/"; //twitch irc server
config.bots = ["Nightbot", "Moobot", "JIBOT"]; // Bots
config.output_div_id = "output"; // <div id="output"></div>
config.chat_line_limit = 300;
config.DEBUG_MODE = false;

const tw_ws = new TwitchWS(config);
*/

class TwitchWS {
    constructor(config) {
        this.config = config;

        this.chat_line_count = 0;
        this.output_div = document.getElementById(config.output_div_id);

        this.websocket = new WebSocket(config.wsUri);

        //websocket的事件監聽器
        this.websocket.onopen = (evt) => { this._onOpen(evt) };
        this.websocket.onclose = (evt) => { this._onClose(evt) };
        this.websocket.onmessage = (evt) => { this._onMessage(evt) };
        this.websocket.onerror = (evt) => { this._onError(evt) };
    }
    _onOpen(evt) {
        this._writeToScreen("[CONNECTED]");
        //this.config.DEBUG_MODE && console.log(evt);

        this._doSend("PASS " + this.config.oauth);
        this._doSend("NICK " + this.config.username);
        this._doSend("JOIN #" + this.config.channel);
        this._doSend("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership");

        //this._doSend("PART #" + t_channel);
        //this._doSend("PRIVMSG #eotones :/mods");
    }
    _onClose(evt) {
        this._writeToScreen("[DISCONNECTED]");
    }
    _onMessage(evt) {
        this.config.DEBUG_MODE && console.log(evt.data);

        let chat_string = evt.data.trim();

        let reg = {};
        reg.msg = new RegExp(" PRIVMSG #[a-zA-z0-9_]+ :(.*?)$", "g");
        reg.name = new RegExp("display-name=(.*?);emote", "g");
        reg.tw_name = new RegExp("!(.*?)@(.*?).tmi.twitch.tv", "g");
        reg.color = new RegExp(";color=(.*?);display-name", "g");
        reg.emotes = new RegExp("emotes=(.*?);id=", "g");
        //reg.msg_mods = new RegExp("The moderators of this room are: (.*?)$","g");

        if (chat_string.match(reg.name) && chat_string.match(reg.msg)) {
            let msg = reg.msg.exec(chat_string);
            msg = msg[1];

            let display_name = reg.name.exec(chat_string);
            display_name = this._htmlEncode(display_name[1]);

            if (display_name.length <= 0) {
                let tw_name = reg.tw_name.exec(chat_string);
                tw_name = this._htmlEncode(tw_name[1]);
                display_name = tw_name;
            }

            let color = reg.color.exec(chat_string);
            color = color[1];

            let emotes = reg.emotes.exec(chat_string);
            emotes = emotes[1];
            let emote_comm = [];

            if (emotes.length <= 0) { //無emotes
                this.config.DEBUG_MODE && console.log("emotes: 無emotes");
                let messageWithEmotes = msg;
            } else { //有emotes
                this.config.DEBUG_MODE && console.log(`emotes: ${emotes}`);
                let emote_arr = emotes.split("/");
                this.config.DEBUG_MODE && console.log(`emotes: ${emote_arr}`);

                let emote_arr2 = [];


                for (let i in emote_arr) {
                    //this.config.DEBUG_MODE && console.log("emotes["+i+"]: "+emote_arr[i]);
                    let emote_split = emote_arr[i].split(":");
                    let emote_id = emote_split[0]; //id
                    let emote_locations = emote_split[1]; //index

                    this.config.DEBUG_MODE && console.log(`emotes[${emote_id}]: ${emote_locations}`);
                    let emote_location = emote_locations.split(",");


                    for (let j in emote_location) {
                        let emote_index = emote_location[j].split("-");
                        let emote_index_start = emote_index[0]; //start
                        let emote_index_end = emote_index[1]; //end
                        this.config.DEBUG_MODE && console.log(`s: ${emote_index_start}, n: ${emote_index_end} ;`);

                        emote_comm[emote_id] = msg.substr(emote_index_start, (emote_index_end - emote_index_start + 1));
                        this.config.DEBUG_MODE && console.log(`emt_comm: ${emote_comm[emote_id]} ;`);
                    }
                }
            }

            msg = this._htmlEncode(msg);

            //轉表情
            if (emote_comm.length > 0) {
                for (let emt_id in emote_comm) {
                    if (emote_comm[emt_id].length > 0) {
                        reg.met = new RegExp(emote_comm[emt_id], "g");
                        msg = msg.replace(reg.met, `<img src="https://static-cdn.jtvnw.net/emoticons/v1/${emt_id}/3.0" alt="${emote_comm[emt_id]}" />`);
                    }
                }
            }

            emote_comm = [];


            //非bot
            if (this.config.bots.indexOf(display_name) < 0) {
                this._writeToScreen(`${this._get_time()} <span class="display_name" style="color:${color}">${display_name}</span> : <br /><span class="msg">${msg}</span>`);
            } else {
                this._writeToScreen(`${this._get_time()} [bot] <span class="display_name" style="color:${color}">${display_name}</span> : <br /><span class="msg">${msg}</span>`);
            }
        }

        //5分鐘回應伺服器一次,防斷線
        if (evt.data.trim() == "PING :tmi.twitch.tv") {
            this._doSend("PONG :tmi.twitch.tv");
        }
    }
    _onError(evt) {
        this._writeToScreen(`<span style="color: red;">[ERROR]:</span> ${this._htmlEncode(evt.data)}`);
    }
    _doSend(message) {
        this.websocket.send(message);
    }
    _htmlEncode(html_c) {
        return html_c.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    _get_time() {
        let now_time = new Date();

        let hours = this._pt(now_time.getHours());
        let minutes = this._pt(now_time.getMinutes());

        let txt_datetime = "[" + hours + ":" + minutes + "]";

        return txt_datetime;
    }
    _pt(num) {
        return (num < 10 ? "0" : "") + num;
    }
    _writeToScreen(message) {
        //避免訊息過多瀏覽器當掉,超過300則訊息時清空畫面
        if (this.chat_line_count > this.config.chat_line_limit) {
            this.output_div.innerHTML = "";
            console.clear();
            this.chat_line_count = 0;
        }

        let pre = document.createElement("div");
        pre.style.wordWrap = "break-word";


        pre.innerHTML = message.replace(/\n/g, "<br />"); // 將"\n"轉換成"<br />"

        this.output_div.appendChild(pre); //輸出訊息在畫面上

        window.scrollTo(0, document.body.scrollHeight); //畫面自動捲動

        this.chat_line_count++; //目前頁面訊息數
    }
}