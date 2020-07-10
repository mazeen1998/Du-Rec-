//Buttons
const vidEle=document.querySelector('video');
const startBtn=document.getElementById('startBtn');
const stopBtn=document.getElementById('stopBtn');
const vidSlct=document.getElementById('vidSlctBtn');
vidSlct.onclick=getVidSrc;

startBtn.onclick= e => {
	mediaRecorder.start();
	startBtn.innerHTML='Recording';
}

stopBtn.onclick= e =>{
	mediaRecorder.stop();
	startBtn.innerText='Start';
}

//Importing inbuilt electron module for desktop capture
//remote used to handle IPC(Inter Process Communication)
const {desktopCapturer , remote}=require('electron');
const {Menu} = remote;
//Getting all Video sources
async function getVidSrc(){
	const inpSrc= await desktopCapturer.getSources({
		types:['window','screen']
	});
	const vidOptMenu=Menu.buildFromTemplate(
		inpSrc.map(srcs=>{
			return{
				label:srcs.name,
				click:()=>slctSrc(srcs)
			}
		})
	)
	vidOptMenu.popup();
}

let mediaRecorder; //media recorder to capture footage
const recordedChunks=[];

//Setting Video Source
async function slctSrc(srcs){
	vidSlct.innerHTML=srcs.name;

	const constraints={
		audio:false,
		video:{
			mandatory:{
				chromeMediaSource:'desktop',
				chromeMediaSourceId:srcs.id,
			}
		}
	}

//Video Stream
const stream= await navigator.mediaDevices.getUserMedia(constraints);

//Displaying the stream 
vidEle.srcObject=stream;
vidEle.play();

//Media Recorder setup
const options ={mimeType:'video/webm; codecs=vp9'};
mediaRecorder = new MediaRecorder(stream,options);

//Events registration
mediaRecorder.ondataavailable=handleDataAvailable;
console.log(mediaRecorder)
mediaRecorder.onstop=handleStop;
}

//Captures all recorded chunks
function handleDataAvailable(e){
	console.log('vid data available');
	console.log(e.stream);
	recordedChunks.push(e.data);

}

const { dialog } = remote;
const { writeFile } = require('fs');

//Saves the video file
async function handleStop(e){
	const blob = new Blob(recordedChunks,
		{type:'video/webm; codecs=vp9'});
	const buffer = Buffer.from(await blob.arrayBuffer());

	const { filePath } = await dialog.showSaveDialog({
		buttonLabel : 'Save Video',
		defaultPath: `vid-${Date.now()}.webm`
	});

	console.log(filePath);
	if(filePath){
	writeFile(filePath,buffer,() => console.log('video saved successfully!'));
	}
	// console.log(recordedChunks)
	console.log(buffer);
}