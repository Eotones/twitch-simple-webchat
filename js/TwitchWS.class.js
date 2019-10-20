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

export default class TwitchWS {
    constructor(config) {
        this.config = config;

        this.chat_line_count = 0;
        this.output_div = document.getElementById(config.output_div_id);
    }

    start(){
        this.websocket = new WebSocket(this.config.wsUri);

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

        /*
            [chat_string]

            if startsWith "@":
            
            ex. 1-1:

                @badge-info=subscriber/2;badges=subscriber/0;color=#FF0000;display-name=BadPotato74;emote-only=1;emotes=1932169:0-8,10-18,20-28;flags=;id=bb3b0dca-9d2a-474f-8b24-93acb1193ef5;mod=0;room-id=29518572;subscriber=1;tmi-sent-ts=1571473531613;turbo=0;user-id=273248848;user-type= :badpotato74!badpotato74@badpotato74.tmi.twitch.tv PRIVMSG #mobilmobil :opcGwawa2 opcGwawa2 opcGwawa2

            ex. 1-2:

                @badge-info=subscriber/2;
                badges=subscriber/0;
                color=#FF0000;
                display-name=BadPotato74;
                emote-only=1;
                emotes=1932169:0-8,10-18,20-28;
                flags=;
                id=bb3b0dca-9d2a-474f-8b24-93acb1193ef5;
                mod=0;
                room-id=29518572;
                subscriber=1;
                tmi-sent-ts=1571473531613;
                turbo=0;
                user-id=273248848;
                user-type= :badpotato74!badpotato74@badpotato74.tmi.twitch.tv PRIVMSG #mobilmobil :opcGwawa2 opcGwawa2 opcGwawa2

        */

        //new user msg
        if(chat_string.startsWith("@")){
            let raw_chat_string = (new RegExp("^@(.*?);user-type= (.*?)$", "g")).exec(chat_string);

            if(Array.isArray(raw_chat_string) && raw_chat_string.length >= 3){
                let raw_user_info = raw_chat_string[1].split(";");
                let raw_user_msg = raw_chat_string[2];
    
                let user_info_arr = [];
    
                for(let i=0; i<raw_user_info.length; i++){
                    let ele = raw_user_info[i];
    
                    let raw_user_info_2 = ele.split("=");
                    let raw_user_info_2_key = raw_user_info_2[0];
                    let raw_user_info_2_value = raw_user_info_2[1];
                    user_info_arr[raw_user_info_2_key] = raw_user_info_2_value;
                }

                let user_msg_arr = (new RegExp(`^:(.*?)!(.*?) PRIVMSG #${this.config.channel} :(.*?)$`, "g")).exec(raw_user_msg);
    
                user_info_arr["_user_msg"] = user_msg_arr[3]; // "opcGwawa2 opcGwawa2 opcGwawa2"
                user_info_arr["_user_account"] = user_msg_arr[1]; // "badpotato74"
                //user_info_arr["_user_eomte_arr"] = user_info_arr["emotes"].split("/");
                user_info_arr["_user_badges_arr"] = user_info_arr["badges"].split(",");

                //filter
                //user_info_arr["_user_msg"] = this._htmlEncode(user_info_arr["_user_msg"]);
                user_info_arr["_user_display_name"] = this._htmlEncode(user_info_arr["display-name"]);

    
                console.log(user_info_arr);

                let emote_comm = [];

                if (user_info_arr["emotes"].length <= 0) { //無emotes
                    this.config.DEBUG_MODE && console.log("emotes: 無emotes");
                    //let messageWithEmotes = msg;
                } else { //有emotes
                    this.config.DEBUG_MODE && console.log(`emotes: ${emotes}`);
                    let emote_arr = user_info_arr["emotes"].split("/");
                    this.config.DEBUG_MODE && console.log(`emotes: ${emote_arr}`);

                    //let emote_arr2 = [];


                    for (let i in emote_arr) {
                        //this.config.DEBUG_MODE && console.log("emotes["+i+"]: "+emote_arr[i]);
                        let emote_split = emote_arr[i].split(":");
                        let emote_id = emote_split[0]; //id
                        let emote_locations = emote_split[1].toString(); //index

                        this.config.DEBUG_MODE && console.log(`emotes[${emote_id}]: ${emote_locations}`);
                        let emote_location = emote_locations.split(",");


                        for (let j in emote_location) {
                            let emote_index = emote_location[j].split("-");
                            let emote_index_start = emote_index[0]; //start
                            let emote_index_end = emote_index[1]; //end
                            this.config.DEBUG_MODE && console.log(`s: ${emote_index_start}, n: ${emote_index_end} ;`);

                            emote_comm[emote_id] = user_info_arr["_user_msg"].substr(emote_index_start, (emote_index_end - emote_index_start + 1));
                            this.config.DEBUG_MODE && console.log(`emt_comm: ${emote_comm[emote_id]} ;`);
                        }
                    }
                }

                //user_info_arr["_user_msg"] = this._htmlEncode(user_info_arr["_user_msg"]);

                //轉表情
                if (emote_comm.length > 0) {
                    for (let emt_id in emote_comm) {
                        if (emote_comm[emt_id].length > 0) {
                            
                            //emote_comm[emt_id] = emote_comm[emt_id].replace(/\)/g, "\\)");
                            //emote_comm[emt_id] = emote_comm[emt_id].replace(/\(/g, "\\(");

                            try{
                                let met = new RegExp(emote_comm[emt_id], "g");
                                
                                if(emote_comm[emt_id].length > 3){
                                    user_info_arr["_user_msg"] = user_info_arr["_user_msg"].replace(met, `<img src="https://static-cdn.jtvnw.net/emoticons/v1/${emt_id}/3.0" alt="${emote_comm[emt_id]}" height="112" />`);

                                    //user_info_arr["_user_msg"] = user_info_arr["_user_msg"].replace(met, `<img src="https://static-cdn.jtvnw.net/emoticons/v1/${emt_id}/3.0" alt="emote" height="112" />`);
                                }
                                
                            }catch{

                            }
                            
                        }
                    }
                }

                emote_comm = [];

                let writeToScreen_html = `<span class="display_name" style="color:${user_info_arr["color"]}">${user_info_arr["_user_display_name"]}</span> : <br /><span class="msg">${user_info_arr["_user_msg"]}</span>`;

                //非bot
                if (this.config.bots.indexOf(user_info_arr["_user_display_name"]) < 0) {
                    //
                } else {
                    writeToScreen_html = `[bot] ${writeToScreen_html}`;
                }

                writeToScreen_html = `${this._get_time()} ${writeToScreen_html}`;

                this._writeToScreen(writeToScreen_html);
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

    _toUnicode(str){
        let result = "";
        for(let i = 0; i < str.length; i++){
            // Assumption: all characters are < 0xffff
            result += "\\u" + ("000" + str[i].charCodeAt(0).toString(16)).substr(-4);
        }
        return result;
    }
    
    _get_time() {
        let now_time = new Date();

        let hours = this._pt(now_time.getHours());
        let minutes = this._pt(now_time.getMinutes());

        let txt_datetime = `[${hours}:${minutes}]`;

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