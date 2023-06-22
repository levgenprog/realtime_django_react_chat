class WebsocketService{
    static instance = null;
    callbacks = {};

    static getInstance(){
        if(!WebsocketService.instance){
            WebsocketService.instance = new WebsocketService();
        }
        return WebsocketService.instance;
    }

    constructor(){
        this.socketRef = null;
    }

    connect(){
        const path = 'ws://127.0.0.1:8000/ws/chat/test/';
        this.socketRef = new WebSocket(path);
        this.socketRef.onopen = e => {
            console.log('websocket is open');
        }
        this.socketNewMessage(JSON.stringify({
            command: 'fetch_messages'
        }));

        this.socketRef.onmessage = e => {
            this.socketNewMessage(e.data);
        }

        this.socketRef.onerror = e => {
            console.log(e.message);
        }

        this.socketRef.onclose = e => {
            console.log('Websocket is closed');
            this.connect();
        }
    }

    socketNewMessage(data){
        const parsedData = JSON.parse(data);
        const command = parsedData.command;
        if(Object.keys(this.callbacks).length === 0){
            return;
        }
        if(command === 'messages'){
            this.callbacks[command](parsedData.messages);
        }
        if(command === 'message'){
            this.callbacks[command](parsedData.message);
        }
    }

    fetchMessages(username){
        this.sendMessage({
            command: 'fetch_messages',
            username: username
        });
    }

    newChatMessage(message){
        this.sendMessage({
            command: 'new_message',
            from: message.from,
            message: message.content
        })
    }

    addCallbacks(messageCallback, newMessageCallback){
        this.callbacks['messages'] = messageCallback;
        this.callbacks['new_message'] = newMessageCallback;
    }

    sendMessage(data){
        try{
            this.socketRef.send(JSON.stringify({...data}))
        }catch (err){
            console.log(err.message);
        }
    }

    getState(){
        return this.socketRef.readyState;
    }

    waitFroSocketConnection(callback){
        const socket = this.socketRef;
        const recursion = this.waitFroSocketConnection;
        setTimeout(() => {
                if (socket.readyState === 1){
                    console.log('connection is secure');
                    if(callback != null){
                        callback();
                    }
                    return;
                }
                else{
                    console.log('waitiong for the new connections... ');
                    recursion(callback);
                }
            }, 1);
    }
}

const WebsocketInstance = WebsocketService.getInstance();

export default WebsocketInstance;