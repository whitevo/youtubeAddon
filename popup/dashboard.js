
/**
 * Title : Youtube Firefox Addon
 * Description : An addon for firefox to facilitate add latest video of their subscriptions to watch later. 
 * Author : Amanjot Singh
 * Email : aman2talk@gmail.com
 * Version : 0.0.1
 * Date : 7 Jun, 2019
 */


var token = '';
var recurringTurn = 0;

$(document).on('click', '.channel-item', function(){
	resetVideoList();
	if ($(this).hasClass('selected')) {
		$(this).removeClass('selected');
	} else {
		$(this).addClass('selected')
	}

	let channelTitles = [];
	let channelIds = [];
	$('.channel-item.selected').each((i, channelItem) => {
		channelTitles.push($(channelItem).find('.channel-title').text());
		channelIds.push($(channelItem).data('channel-id'));
	});

	$("#target-channel").html(channelTitles.join());
	getLocalToken().then((token) => {
		getVideoListForChannels(channelIds);
	});
});


$("#channel-list-reload").click(function(){
	resetVideoList(true);
	getLocalToken().then((token) => {
		getSubscriptionList();
	});
});


$(document).on('click', '.select-video-btn', function(){
	let currentItemIndex = $(this).parents('.list-item').index();
	let allItems = $(this).parents('.item-list').find('.video-item');
	allItems.removeClass('selected');
	allItems.slice(0, currentItemIndex + 1).addClass('selected');
	let selectedVidCount = $(this).parents('.item-list').find('.video-item.selected').length;
	let msg = selectedVidCount ? selectedVidCount + ' videos' : 'No video';
	$("#slected-video-msg").text(msg);
	$("#confirm-btn").attr('disabled', false);
});


$("#confirm-btn").click(function(){
	$(this).hide();
	let promises = [];
	let targetVideos = $("#channel-video-list .content-window .list-item.selected");
	recurringTurn = 0;
	recurringFunc(targetVideos);
	
});


function recurringFunc(videos){
	let item = videos[recurringTurn];
	let videoId = $(item).data('video-id');
	$("#processing-msg").show();
	$("#confirm-btn").hide();
	setTimeout( () => {
		addVideoToWatchList(videoId).then(() => {
			let percent = Math.round(((recurringTurn + 1)/videos.length)*100);
			console.log("percwent",recurringTurn, videos.length, percent, $("#percent-complete").html());
			$("#percent-complete").html(percent);
			recurringTurn++;
			if (recurringTurn < videos.length) {
				recurringFunc(videos);
			} else {
				// processed;
				$("#processing-msg").hide();
				$("#confirm-btn").show();
				$("#percent-complete").html(0);
				resetVideoList(true);
				alert("Video added to watch later list successfully");
			}
		});
	},0);
}

function resetVideoList(resetCannelList){
	$("#channel-video-list .content-window").text('No video available');
	if (resetCannelList)
		$("#channel-list .content-window .selected").removeClass('selected');
	$("#target-channel").text("No channel selected");
	$("#slected-video-msg").text("No video");
	$("#confirm-btn").attr('disabled', true);
}

$("#authorize-btn").click(function(){
	console.log('execute pressed');
	signinAndFetch();	
});

function signinAndFetch(){
	getAccessToken()
		.then((accessToken) => {
			token = accessToken;
			browser.storage.local.set({yt_token: accessToken}, function() {
				console.log('Value is set to ', accessToken);
			});
			return getUserInfo();
		})
		.then(notifyUser)
		.then(getSubscriptionList)
		.catch(logError);
}

function notifyUser(user) {
	$(".not-authorized-state").hide();
	$(".authorized-state").show();
	$("#account-name").html(user.name);
	return browser.notifications.create({
    "type": "basic",
    "title": "Youtube Helper",
    "message": `Hi ${user.name}, You have been successfully logged in.`
	});
}

function invalidCredentials(){
	$(".not-authorized-state").show();
	$(".authorized-state").hide();
}

function logError(error) {
  console.error(`Error: ${error}`);
}


function getUserInfo() {
	const url = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json';
	return fireApi(url);
}

function getChannelVideos(channelId) {
	const url = "https://www.googleapis.com/youtube/v3/search?key={}&channelId="+channelId+"&part=snippet,id&order=date&maxResults=50";
	return fireApi(url).then(response => response.items);
}

function getSubscriptionList() {
	let target = $("#channel-list");
	target.find('.loading-msg').show();
	target.find('.content-window, .error-msg').hide();
	const url = 'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet%2CcontentDetails&mine=true&maxResults=50';
	fireApi(url).then((response)=>{
		console.log("iiio", response);
		buildChanelList(response.items);
	});
	
}

function getLocalToken() {
	return browser.storage.local.get(['yt_token']).then((storage) => {
		token = storage.yt_token;
		return storage.yt_token;
	});
}

function fireApi(url, method, body) {
	let accessToken = token;
	console.log("I am using this token : ", token);
	const requestURL = url;
	const requestHeaders = new Headers();
	requestHeaders.append('Authorization', 'Bearer ' + accessToken);
	requestHeaders.append('Content-Type', 'application/json');
	const request = new Request(requestURL, {
		method: method ? method : "GET",
		headers: requestHeaders,
		mode : 'cors',
		redirect : 'follow',
		body : JSON.stringify(body)
	});

  return fetch(request).then((response) => {
	if (response.status === 200) {
			return response.json();
    } else {
			if (response.status === 401) {
				invalidCredentials();
			}
      throw response.status;
    }
  });

}

function addVideoToWatchList(videoId) {
	let url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet';
	
	let body = {
		"snippet": {
			"playlistId": "WL",
			"position": 0,
			"resourceId": {
				"kind": "youtube#video",
				"videoId": videoId
			}
		}
	};
	
	return fireApi(url, 'POST', body);
}

/***************** UI Manipulation**********************/


function getVideoListForChannels(channels) {
	let target = $("#channel-video-list");
	target.find('.loading-msg').show();
	target.find('.content-window, .error-msg').hide();
	let allChannels = [];
	channels.forEach((channelId, index) => {
		allChannels.push(getChannelVideos(channelId));
	});
	Promise.all(allChannels).then(function(channelVideos) {
		let videos = [].concat.apply([], channelVideos);
		//sort all videos
		videos.sort(function(a,b){
			// Turn your strings into dates, and then subtract them
			// to get a value that is either negative, positive, or zero.
			return new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt);
		});
		buildChanelVideoList(videos);
	});
}

function buildChanelList(items){
	var listHtml = '';
	items.forEach((item, index) => {
		let snippet = item.snippet;
		let channelID = snippet.resourceId.channelId;
		let thumbnail = snippet.thumbnails.default.url;
		let channelTitle = snippet.title;
	
		listHtml += `
			<div class="channel-item list-item" data-channel-id="${channelID}">
				<div class="channel-logo"><img src="${thumbnail}"/></div>
				<div class="channel-title item-title">
					${channelTitle}
				</div>
			</div>
		`;
	});
	let target = $("#channel-list");
	target.find('.content-window').html(listHtml).show();
	target.find('.loading-msg').hide();
}


function buildChanelVideoList(items){
	var listHtml = '';
	items.forEach((item, index) => {
		let snippet = item.snippet;
		let videoID = item.id.videoId;
		let thumbnail = snippet.thumbnails.default.url;
		let videoTitle = snippet.title;
	
		listHtml += `
			<div class="video-item list-item" data-video-id="${videoID}">
				<div class="video-thumbnail"><img src="${thumbnail}"/></div>
				<div class="video-title item-title">
					${videoTitle}
				</div>
				<div class="select-video-btn" title="Select this and all above">Start from here</div>
			</div>
		`;

	});


	let target = $("#channel-video-list");
	target.find('.content-window').html(listHtml).show();
	target.find('.loading-msg').hide();
}

// start on page load
getLocalToken()
	.then(getUserInfo)
	.then(notifyUser)
	.then(getSubscriptionList)
	.catch(invalidCredentials);