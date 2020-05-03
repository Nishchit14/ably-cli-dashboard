const blessed = require('blessed')
const contrib = require('blessed-contrib')
const screen = blessed.screen()

const CONSTANTS = {
  CHANNEL_NAME: "express-server-info",
  EVENT_BATTERY_STATUS: "ON_BATTERY_STATUS",
  EVENT_CPU_TEMP: "ON_CPU_TEMP",
  EVENT_CPU_MEM: "ON_CPU_MEM",
  EVENT_NETWORK_STATS: "ON_NETWORK_STATS",
  EVENT_DISK_IO_STATS: "ON_DISK_IO_STATS"
}


let ably = new require('ably').Realtime(process.env.ABLY_KEY);
let channelServerInfo = ably.channels.get(CONSTANTS.CHANNEL_NAME);

let batteryTimeStamp = [], batteryTiming= []
channelServerInfo.subscribe(CONSTANTS.EVENT_BATTERY_STATUS, (message) => {
	updateBatteryDonut(message.data.percent, message.data.timeremaining);

	batteryTimeStamp.push(new Date().toLocaleTimeString());
	batteryTiming.push(message.data.timeremaining)
	batteryTimeBar.setData({titles: batteryTimeStamp.slice(-10), data: batteryTiming.slice(-10)})

	screen.render()
});

let readIOLine= {
	title: 'Read',
	style: {line:'blue'},
  x: [],
  y: []
};

let writeIOLine= {
	title: 'Write',
	style: {line:'red'},
  x: [],
  y: []
};
channelServerInfo.subscribe(CONSTANTS.EVENT_DISK_IO_STATS, (message) => {
	// console.log(message.data, "onDiskIOStats");
	readIOLine.x.push(new Date().toLocaleTimeString());
	readIOLine.y.push(message.data.rIO);
	readIOLine.y = readIOLine.y.slice(-15)
	readIOLine.x = readIOLine.x.slice(-15)

	writeIOLine.x.push(new Date().toLocaleTimeString());
	writeIOLine.y.push(message.data.wIO);
	writeIOLine.y = writeIOLine.y.slice(-15)
	writeIOLine.x = writeIOLine.x.slice(-15)

	setLineData([readIOLine, writeIOLine], diskIOChart)
	screen.render()
});

let grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

// Create a random color
function randomColor() {
  return [Math.random() * 255,Math.random()*255, Math.random()*255]
}

let batteryPerDonut = grid.set(6, 6, 6, 2, contrib.donut, {
	label: 'Battery Percent',
	radius: 16,
	arcWidth: 4,
	yPadding: 2,
	data: [{label: 'Battery', percent: 100}]
})

let batteryTimeBar = grid.set(6, 0, 6, 6, contrib.bar,
  { label: 'Battery Remaining Time'
  , barWidth: 4
  , barSpacing: 6
  , xOffset: 2
  , maxHeight: 9})

let diskIOChart = grid.set(0, 0, 6, 6, contrib.line,
          { showNthLabel: 5
          , maxY: 20
          , label: 'Disk Input/Output'
          , showLegend: true
          , legend: {width: 10}})




/*let sparkline = grid.set(10, 10, 2, 2, contrib.sparkline,
  { label: 'Throughput (bits/sec)'
  , tags: true
  , style: { fg: 'blue', titleFg: 'white' }})*/

/*//set spark dummy data
let spark1 = [1,2,5,2,1,5,1,2,5,2,1,5,4,4,5,4,1,5,1,2,5,2,1,5,1,2,5,2,1,5,1,2,5,2,1,5]
let spark2 = [4,4,5,4,1,5,1,2,5,2,1,5,4,4,5,4,1,5,1,2,5,2,1,5,1,2,5,2,1,5,1,2,5,2,1,5]

refreshSpark()
setInterval(refreshSpark, 1000)

function refreshSpark() {
  spark1.shift()
  spark1.push(Math.random()*5+1)       
  spark2.shift()
  spark2.push(Math.random()*5+1)       
  sparkline.setData(['Server1', 'Server2'], [spark1, spark2])  
}*/

function updateBatteryDonut(pct){

  let color = "green";
  if (pct <= 75) color = "cyan";
  if (pct <= 50) color = "yellow";
  if (pct <= 25) color = "red";
  batteryPerDonut.setData([
    {percent: parseFloat(pct).toFixed(2), label: 'Battery', 'color': color}
  ]);

	// batteryTimeBar.setData({titles: servers, data: arr})
}

function setLineData(mockData, line) {
  for (let i=0; i<mockData.length; i++) {
    let last = mockData[i].y[mockData[i].y.length-1]
    mockData[i].y.shift()
    let num = Math.max(last + Math.round(Math.random()*10) - 5, 10)    
    mockData[i].y.push(num)
  }
  line.setData(mockData)
}


screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render()
