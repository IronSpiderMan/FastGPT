function isIOS() {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
}

class AvatarWebsocket {
    constructor(eleId = 'content', api_base = 'localhost:8080/api/v1', callBacks = {}, ssl = true) {
        if (ssl) {
            this.socketUrl = `wss://${api_base}/ws`;
            this.apiUrl = `https://${api_base}/avatars`
        } else {
            this.socketUrl = `ws://${api_base}/ws`;
            this.apiUrl = `http://${api_base}/avatars`
        }
        this.videoSocket = null;
        this.audioSocket = null;
        this.clientId = null;
        this.inferenceSocket = null;
        this.audioContext = null;
        this.videoQueue = [];
        this.audioQueue = [];
        this.inferenceQueue = [];
        this.playVideoInterval = null;
        this.playingIndex = 0;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.mimeType = 'audio/webm'
        // 是否推理结束
        this.isReasoningEnd = true;
        // 是否播放推理
        this.isPlaying = false;
        this.container = document.getElementById(eleId);
        this.createImageContainer()

        // 生命周期回调函数
        // 当数字人必要内容准备完成后调用
        this.onReady = callBacks.onReady || (() => {
        });
        // 当数字人关闭时调用
        this.onClose = callBacks.onClose || (() => {
        });
        // 当数字人收到消息后调用
        this.onMessage = callBacks.onMessage || ((msg) => {
        });
        // 当数字人讲完话后调用
        this.onTalkEnd = callBacks.onTalkEnd || (() => {
        })
        // 当发送错误时调用
        this.onError = callBacks.onError || ((error) => {
        });
    }

    createImageContainer() {
        // 创建图片元素
        this.imageEle = document.createElement('img');
        this.imageEle.style.pointerEvents = 'none'; // 禁用事件以避免干扰
        this.container.appendChild(this.imageEle);
        // 创建画布元素
        this.canvasEle = document.createElement('canvas');
        this.canvasEle.style.pointerEvents = 'none'; // 禁用事件以避免干扰
        this.container.appendChild(this.canvasEle);
    }

    /**
     * 连接数字人，调用prepare接口获取必要内容。建立audio和inference接口的连接
     */
    connect(avatar_id) {
        console.log('start connect ws....')
        // Create Video Websocket
        if (!this.videoSocket || this.videoSocket.readyState !== WebSocket.OPEN) {
            this.videoSocket = new WebSocket(`${this.socketUrl}/prepare/${avatar_id}`);
            this.videoSocket.binaryType = 'arraybuffer';
            this.videoSocket.onmessage = (event) => {
                if (typeof event.data === 'string') {
                    this.clientId = event.data.split("#")[1]
                    console.log('ws prepared...');
                    this.connectInference()
                    this.videoSocket.close();
                    if (!this.playVideoInterval) {
                        let reversedVideoQueue = this.videoQueue.slice().reverse();
                        this.videoQueue = this.videoQueue.concat(reversedVideoQueue);
                        this.playVideoInterval = setInterval(() => this.playVideoQueue(), 1000 / 25)
                        // 默认视频开始播放时准备完成
                        this.onReady();
                    }
                } else {
                    const blob = new Blob([event.data], {type: "image/jpeg"})
                    this.videoQueue.push(blob);
                }
            }
            this.videoSocket.onclose = () => {}
        }
    }

    connectInference() {
        // Create Audio Websocket
        if (!this.audioSocket || this.audioSocket.readyState !== WebSocket.OPEN) {
            this.audioSocket = new WebSocket(`${this.socketUrl}/audio/${this.clientId}`);
            this.audioSocket.binaryType = 'arraybuffer';
            this.audioSocket.onmessage = (event) => {
                const buffer = new Float32Array(event.data);
                this.audioQueue.push(buffer)
            }
            this.audioSocket.onclose = () => {
                this.audioQueue = [];
                this.close();
            }
        }
        // Create Inference Websocket
        if (!this.inferenceSocket || this.inferenceSocket.readyState !== WebSocket.OPEN) {
            this.inferenceSocket = new WebSocket(`${this.socketUrl}/inference/${this.clientId}`);
            this.inferenceSocket.binaryType = 'arraybuffer';
            this.inferenceSocket.onmessage = (event) => {
                if (typeof event.data === 'string') {
                    if (event.data === '<start>') {
                        this.isReasoningEnd = false;
                        console.log('开始推理');
                    } else if (event.data === '<end>') {
                        this.isReasoningEnd = true;
                        console.log('推理结束');
                    }
                } else {
                    const blob = new Blob([event.data], {type: "image/jpeg"})
                    this.inferenceQueue.push(blob);
                    // 当缓存了2s的视频后，且当前未在播放
                    if (this.inferenceQueue.length > 10 && !this.isPlaying) {
                        console.log('开始播放推理')
                        this.isPlaying = true;
                        // 暂停播放视频
                        clearInterval(this.playVideoInterval);
                        this.playVideoInterval = null;
                        this.playInference()
                    }
                }
            }
            this.inferenceSocket.onclose = () => {
                console.log('ws end!')
                this.close()
            }
        }
    }

    async startRecord() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.log('不支持录音');
            return;
        }
        // 检查 MediaRecorder 是否存在以及是否正在录音
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({audio: true});
                if (isIOS()) {
                    this.mimeType = 'audio/mp4'
                }
                this.mediaRecorder = new MediaRecorder(stream, {mimeType: this.mimeType});
                this.recordedChunks = [];
                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        this.recordedChunks.push(event.data);
                    }
                };
                this.mediaRecorder.start();
                console.log('开始录音');
            } catch (err) {
                console.error('录音错误', err);
            }
        } else if (this.mediaRecorder.state === 'recording') {
            console.log('已经在录音');
        } else if (this.mediaRecorder.state === 'paused') {
            console.log('录音已暂停，无法重复录音');
        }
    }

    stopRecord() {
        return new Promise((resolve) => {
            if (this.mediaRecorder) {
                this.mediaRecorder.onstop = () => {
                    console.log('录音停止')
                    resolve();
                    this.mediaRecorder = null;
                };
                this.mediaRecorder.stop();
            } else {
                resolve();
            }
        })

    }

    async asr() {
        await this.stopRecord();
        if (this.recordedChunks.length > 0) {
            const blob = new Blob(this.recordedChunks, {type: this.mimeType});
            const formData = new FormData();
            const filename = 'recording.' + this.mimeType.split('/')[1];
            formData.append('audio', blob, filename);
            const url = `${this.apiUrl}/ask/${this.clientId}`
            try {
                const response = await fetch(url, {method: 'POST', body: formData});
                const {ok, status} = response;
                if (ok) {
                    console.log('上传成功')
                    const msg = await response.json();
                    this.onMessage(msg);
                } else {
                    console.error('上传失败', status)
                }
            } catch (err) {
                console.log('上传错误', err)
            } finally {
                this.recordedChunks = [];
            }
        } else {
            console.log('没有录音文件可上传');
        }
    }

    async talk(text) {
        const params = new URLSearchParams({text});
        const url = `${this.apiUrl}/talk/${this.clientId}?${params.toString()}`; // 提取 URL 常量
        try {
            const response = await fetch(url);
            if (!response.ok) {
                // 处理非 200 响应
                const errorData = await response.json(); // 获取错误信息
                console.error('上传失败', response.status, errorData);
                return; // 早期返回
            }
            const data = await response.json(); // 处理成功的响应
            console.log(data);
        } catch (error) {
            console.error('发生错误', error); // 更详细的错误信息
        }
    }

    async interrupt() {
        // 清空当前推理状态
        this.isReasoningEnd = true;
        this.audioQueue = []
        this.inferenceQueue = []
        this.isPlaying = false;
        if (!this.playVideoInterval) {
            this.playVideoInterval = setInterval(() => this.playVideoQueue(), 1000 / 25)
        }
        try {
            const response = await fetch(`${this.apiUrl}/interrupt/${this.clientId}`, {
                method: 'POST',
            })
            const data = await response.json();
            console.log(data)
        } catch (error) {
            console.error(error)
        }
    }


    displayImage(blob) {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            // 获取容器的宽高
            const containerWidth = this.container.clientWidth;
            const containerHeight = this.container.clientHeight;

            // 计算图像的宽高比
            const imgAspectRatio = img.width / img.height;
            const containerAspectRatio = containerWidth / containerHeight;

            // 设置画布的大小
            if (imgAspectRatio > containerAspectRatio) {
                this.canvasEle.width = containerWidth;
                this.canvasEle.height = containerWidth / imgAspectRatio;
            } else {
                this.canvasEle.height = containerHeight;
                this.canvasEle.width = containerHeight * imgAspectRatio;
            }

            // 清除画布
            const context = this.canvasEle.getContext('2d', {willReadFrequently: true}); // Set the option here
            context.clearRect(0, 0, this.canvasEle.width, this.canvasEle.height);

            // 绘制图像
            if (this.canvasEle.height === 0 || this.canvasEle.width === 0) {
                this.onError("画布不见了");
                this.close();
                return false;
            }
            context.drawImage(img, 0, 0, this.canvasEle.width, this.canvasEle.height);

            // 抠图：将白色背景变为透明
            const imageData = context.getImageData(0, 0, this.canvasEle.width, this.canvasEle.height);
            const data = imageData.data;

            const threshold = 245;
            for (let i = 0; i < data.length; i += 4) {
                // 将白色背景（或接近白色）设置为透明
                const r = data[i];     // 红色通道
                const g = data[i + 1]; // 绿色通道
                const b = data[i + 2]; // 蓝色通道

                // 检查颜色是否接近白色
                if (r > threshold && g > threshold && b > threshold) {
                    data[i + 3] = 0; // 将 alpha 通道设置为 0 (透明)
                }
            }
            // 将修改后的图像数据放回画布
            context.putImageData(imageData, 0, 0);
            URL.revokeObjectURL(url);
        }
        img.src = url;
        return true;
    }

    playVideoQueue() {
        if (this.videoQueue.length > 0) {
            this.playingIndex = (this.playingIndex + 1) % this.videoQueue.length
            const blob = this.videoQueue[this.playingIndex];
            this.displayImage(blob);
        }
    }

    playInference() {
        if (!this.audioContext) {
            this.audioContext = new AudioContext({sampleRate: 16000});
        }
        if (this.audioQueue.length > 0 && this.inferenceQueue.length > 0 && this.audioContext && this.audioContext.state === 'running') {
            // 播放视频
            if (this.imageEle.src) {
                URL.revokeObjectURL(this.imageEle.src);
            }
            const blob = this.inferenceQueue.shift();
            this.displayImage(blob)
            // 播放音频
            const audioData = this.audioQueue.shift();
            if (!audioData) {
                return
            }
            const buffer = this.audioContext.createBuffer(1, audioData.length, 16000);
            const float32Array = new Float32Array(audioData.buffer);
            buffer.copyToChannel(float32Array, 0);
            const bufferSource = this.audioContext.createBufferSource();
            bufferSource.buffer = buffer;
            bufferSource.connect(this.audioContext.destination);
            bufferSource.start();
            bufferSource.onended = () => this.playInference();
        } else if (!this.isReasoningEnd) {
            setTimeout(() => this.playInference(), 100);
        } else if (this.isReasoningEnd && (this.audioQueue.length === 0 || this.inferenceQueue.length === 0)) {
            this.isPlaying = false;
            this.audioQueue = []
            this.inferenceQueue = []
            // 播放视频
            if (!this.playVideoInterval) {
                this.playVideoInterval = setInterval(() => this.playVideoQueue(), 1000 / 25)
            }
            this.onTalkEnd()
        }
    }


    close() {
        // 清除视频和推理播放定时器
        if (this.playVideoInterval) {
            clearInterval(this.playVideoInterval);
            this.playVideoInterval = null;
        }
        // 关闭 WebSocket 连接
        if (this.videoSocket && this.videoSocket.readyState === WebSocket.OPEN) {
            this.videoSocket.close();
            this.videoSocket = null;
        }
        if (this.audioSocket && this.audioSocket.readyState === WebSocket.OPEN) {
            this.audioSocket.close();
            this.audioSocket = null;
        }
        if (this.inferenceSocket && this.inferenceSocket.readyState === WebSocket.OPEN) {
            this.inferenceSocket.close();
            this.inferenceSocket = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // 清空队列
        this.videoQueue = [];
        this.audioQueue = [];
        this.inferenceQueue = [];

        // 重置播放状态
        this.isPlaying = false;
        this.isReasoningEnd = true;
        this.clientId = null;

        // 释放 imageEle 资源
        if (this.imageEle && this.imageEle.src) {
            URL.revokeObjectURL(this.imageEle.src);
            this.imageEle.src = '';
        }

        this.onClose();
        console.log('WebSocket connections closed and resources cleaned up.');
    }

}

window.AvatarWebsocket = AvatarWebsocket;
