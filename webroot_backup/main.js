// apip2p为单例模式 直接挂载到全局使用即可
// require(['api1'], function (apip2p) {
    // window.apip2p =  require('./modules/kp2p_js/api')
window.onload = function(){
    // 注册回调 所有回调仅需注册一次即可
    apip2p.onconnect = function (api_conn, code) {
        console.log("onconnect:%d", code);
        console.log(api_conn)
        // 连接成功后登录设备 后续需要将用户名和密码更改为用户输入
        if (code === 0){
            setTimeout(function(){
                apip2p.login(api_conn, "admin", "");
            }, 0)
        }
    }

    apip2p.onloginresult = function (api_conn, result) {
        console.log("onloginresult:%d", result)
    }

    apip2p.ondisconnect = function (api_conn, code) {
        console.log("ondisconnect:%d", code)
    }

    apip2p.onclosestream = function (api_conn, channel, stream, result) {
        console.log("onclosestream:%d, channel:%d, stream:%d", result, channel, stream);

        // 更换标签，清除通道内容
        if (api_conn.preview[channel]) {
            if (api_conn.preview[channel].player){
                var canvas_el = api_conn.preview[channel].player.node;
                var parent = canvas_el.parentNode;
                parent.removeChild(canvas_el)
                parent.appendChild(canvas_el.cloneNode(true))
            }
            api_conn.preview[channel] = null
        }
    }

    apip2p.onopenstream = function (api_conn, channel, stream, result, cam_desc) {
        console.log("onopenstream:%d, cam_desc:%s, channel:%d, stream:%d", result, cam_desc, channel, stream);
    }

    // 初始化音频解码器
    var FAudioDecode = null;
    // FAudioDecode = new JA_JSAudio(audioSendProc);
    function audioSendProc(buffer) {

    }
    // 预览
    apip2p.onrecvframeex = function (api_conn, frametype, data, data_len, channel, width_samplerate, height_samplewidth, enc, channels) {
        if(window.location.hash.indexOf('preview') < 0){   // 不在预览界面时不解码
            return
        }
        if (frametype == 1 || frametype == 2) {

                // var laball = document.querySelector('#video-'+channel+'-div')
                // if(laball){
                //     var ani = laball.querySelector('.la-ball-scale-pulse')
                //     if (ani){
                //         ani.style.display = 'none'
                //     }
                // }
        
            // console.log("onrecvframeex------->frametype:"+frametype+",data_len:"+data_len+"--"+data[0]+"--"+data[1]+"--"+data[2]+"--"+data[3]+"--"+data[4]);
            // console.log("data_channel:",channel,"enc",enc, data)
            // 根据H264或H265创建相应的player（H264使用canvas，H265使用video）
            if (enc === 'H264') {
                if (api_conn.preview[channel] && !api_conn.preview[channel].player) {
                    api_conn.preview[channel].player =new JMuxer({
                        node: api_conn.preview[channel].video_id,
                        mode: "video",
                        fps:25,
                        //flushingTime: 67,
                        clearBuffer:false,
                        debug: false
                    });
                }
                // if (enc === 'AAC') return 
                // 解码交给下一轮事件轮巡，防止阻塞影响心跳包发送
                setTimeout(function(){
                    api_conn.preview[channel] ? api_conn.preview[channel].player.feed({ video: data}) : ''
                }, 80)

                /* if (api_conn.preview[channel] && !api_conn.preview[channel].player) {
                    api_conn.preview[channel].player = new Player({
                        userWorker: true,
                        reuseMemory: true,
                        canvasId: api_conn.preview[channel].video_id,
                        webgl: true,
                        size: { width: 640, height: 368 }
                    })
                }
                // 解码交给下一轮事件轮巡，防止阻塞影响心跳包发送
                setTimeout(function(){
                    api_conn.preview[channel] ? api_conn.preview[channel].player.decode(data) : ''
                }, 0) */
            } else if (enc === 'H265') {
                return
                if (api_conn.preview[channel] && !api_conn.preview[channel].decoder) {
                    var image = document.getElementById(api_conn.preview[channel].video_id)
                    var h265player = new libde265.RawPlayer(image)
                    var decoder = new libde265.Decoder()
                    decoder.set_image_callback(function (image) {
                        h265player._display_image(image);
                        image.free();
                    });
                    api_conn.preview[channel].decoder = decoder
                    api_conn.preview[channel].player = h265player
                    // decoder.decodePreview()   // 启动解码器
                }
                // setTimeout(function(){
                        api_conn.preview[channel] ? api_conn.preview[channel].decoder.push_data_bylive(data) : ''
                    // }, 1)
                    
                }
            }else if (frametype == 0){
                // 音频

            var activeCanvas = document.querySelector('canvas[class="active"]')
            if (api_conn.preview[channel] && activeCanvas && api_conn.preview[channel].video_id == activeCanvas.id) {
                if (api_conn.preview[channel] && !api_conn.preview[channel].audio) {
                    //通道音频初始化
                    var Audio_w = ""   //ljson.Live.frameHead.av.width;
                    var Audio_sampleRate = ""   //ljson.Live.frameHead.av.fps;
                    var audiochannel = 1;
                    var Audio_sampleRate = sampleRate = 8000;
                    var Audio_w = sampleWidth = 16;
                    var nAvgBytesPerSec = (Audio_sampleRate * audiochannel * Audio_w) / 8;
                    api_conn.preview[channel].audio = FAudioDecode.initPlayer(audiochannel, nAvgBytesPerSec, Audio_sampleRate);
                }
                var decbuf = G711.alawdecode(data);
                FAudioDecode.PlayBuffer(decbuf);  
            }else{
                if (api_conn.preview[channel] && api_conn.preview[channel].audio) {
                    //切换通道时不在播放声音
                    if (FAudioDecode != null) {
                        FAudioDecode.stop();
                        FAudioDecode.release();
                        api_conn.preview[channel].audio = null
                    }
                }
            }
                

        }
    }

    // 远程设置
    apip2p.onremotesetup = function (api_conn, str, data_size, result) {
        var json = JSON.parse(str);
        console.log(json)

    }
    apip2p.onptzresult = function (a) {
        console.log("onptzresult")
        console.log(a)
    }

    // 回放
    apip2p.onrecvrecframe = function (api_conn, frametype, data, data_length, channel, width, height, enc, fps, time) {
        if (window.location.hash.indexOf('playback') < 0) {   // 不在回放界面时不解码
            return
        }

        if (frametype == 1 || frametype == 2) {
            
            if (enc == 'H264') {    // video   video#id: playback-video
                console.log(new Date(time), data)
                if (api_conn.playback && !api_conn.playback.player){
                    api_conn.playback.player = new JMuxer({
                        node: "playback-video",
                        mode: "video",
                        // fps: 25,
                        // flushingTime: 67,
                        clearBuffer: false,
                        debug: false
                    });
                }
                setTimeout(function(){
                    api_conn.playback.player.feed({ video: data })
                }, 20)

            } else if (enc == 'H265') {   // canvas canvas#id: playback-canvas


            }


        }

    }
function doSave(value, type, name) {
    var blob;
    if (typeof window.Blob == "function") {
        blob = new Blob([value], { type: type });
    } else {
        var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder;
        var bb = new BlobBuilder();
        bb.append(value);
        blob = bb.getBlob(type);
    }
    var URL = window.URL || window.webkitURL;
    var bloburl = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    if ('download' in anchor) {
        anchor.style.visibility = "hidden";
        anchor.href = bloburl;
        anchor.download = name;
        document.body.appendChild(anchor);
        var evt = document.createEvent("MouseEvents");
        evt.initEvent("click", true, true);
        anchor.dispatchEvent(evt);
        document.body.removeChild(anchor);
    } else if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, name);
    } else {
        location.href = bloburl;
    }
}



    var ip = '192.168.22.210' //'192.168.199.223'//''//'192.168.12.41'//'192.168.22.210'//''//''//'192.168.199.189'////''
    var id = ''//'1080857007'//''//'924957972'//''//'1080856711'//938644594'//  ////'925932481' //

    // var ip = window.location.hostname
    //var id = 'DA4327CYKNLG478R111A';


    // 设备句柄，网页生命周期中只需连接一个设备，所以句柄也只需存在一个即可
    window.conn = null

    function createConn() {
        conn = apip2p.create(0)
        conn.preview = {}

        // 回放只需一个标签
        conn.playback = {
            player: null,
            video_id: 'playback-canvas'
        }

        if (ip) {
            console.log("connectbyip");
            apip2p.connectbyip(conn, ip, '10000')
        } else if (id) {
            apip2p.connectbyid(conn, id)
        }
    }

    // 创建连接句柄，需在登录后进行
    createConn()



    // @param 播放视频的标签ID（video || canvas）, 通道
    function connectVideo(video_id, channel) {

        // var item = document.querySelector('#video-'+channel+'-div');
        // var loadinghtml = document.createElement('div');
        // loadinghtml.setAttribute('class','la-ball-scale-pulse')
        // loadinghtml.innerHTML = "<div></div><div></div>";
        // item.appendChild(loadinghtml);

        console.log('video_id:%s , channel:%d', video_id, channel)

        if (conn === null) {
            createConn()
        }

        if (conn.preview[channel]) return

        conn.preview[channel] = {
            player: null,
            video_id: video_id
        }

        openStream(channel, 1)

    }

    // @param 通道
    function closeVideo(channel, stream) {
        stream = stream || 1
        apip2p.close_stream(conn, channel, stream)
        // var video_div = document.querySelector('#video-'+channel+'-div')
        // var laball = video_div.querySelector('.la-ball-scale-pulse')
        // video_div.removeChild(laball)
    }

    // @param 通道, 主次码流(1次码流，0主码流)
    function openStream(channel, stream) {
        apip2p.open_stream(conn, channel, stream)
    }


    // 播放预览
    window.addEventListener('playVideo', function (event) {
        // var dvr_type = 'sub';
        // dvr_ocx.OpenStream(event.detail.channel, dvr_type == "main" ? 0 : 1);
        // return;
        
        connectVideo(event.detail.winID, event.detail.channel)
    })

    // 关闭预览
    window.addEventListener('closeVideo', function (event) {
        closeVideo(event.detail.channel)
    })

    // 回放
    window.addEventListener('openPlayback', function (event) {
        setTimeout(function(){
            if (!conn.playback.player) {
                // conn.playback.player = new Player({
                //     userWorker: false,
                //     reuseMemory: true,
                //     canvasId: conn.playback.video_id,
                //     webgl: true,
                //     size: { width: 640, height: 368 }
                // })

                // conn.playback.player = new JMuxer({
                //     node: "playback-video",
                //     mode: "video",
                //     fps: 25,
                //     //flushingTime: 67,
                //     clearBuffer: false,
                //     debug: true
                // });
            }
            var Timeset = new Date().getTimezoneOffset() * 60; // 获取系统时区相差小时 -8 

            var timestamp1 = event.detail.startTime;// - Timeset;
            var timestamp2 = event.detail.endTime;// - Timeset; 

            apip2p.replay_start(conn, 0, timestamp1, timestamp2, event.detail.type )//event.detail.type
            // 可能需要将开始时间和结束时间进行时区处理
            // - (new Date().getTimezoneOffset() * 60)
        }, 100)
    })

    // 停止回放
    window.addEventListener('closePlayback', function (event) {
        apip2p.replay_stop(conn)
    })

    // 云台控制
    window.addEventListener('ptz_ctrl', function (event) {
        console.log(event.detail)
        var activeCanvas = document.querySelector('canvas[class="active"]')
        for (var channel in conn.preview){
            if (conn.preview[channel] && activeCanvas && conn.preview[channel].video_id == activeCanvas.id){
                apip2p.ptz_ctrl(conn, channel, event.detail.action, event.detail.speed)
                break
            }
        }
    })

    //切换码流
    window.addEventListener('switchStream', function (event) {
        openStream(event.detail.channel, event.detail.stream)
    })


    // 页面刷新之前关闭socket
    window.onbeforeunload = function () {
        conn ? apip2p.close_socket(conn) : ''
    }
// });
}