
	function buttonHold(element, action_function, hold_time_ms) {
		const test_execute = function() { if (element.matches(':hover')){ action_function(); }};
		setTimeout(test_execute, hold_time_ms)
	}
        function hoverHold(element, action_function, hold_time_ms) {
                const test_execute = function() { if (element.matches(':hover')){ action_function(); }};
                setTimeout(test_execute, hold_time_ms)
        }
    // Function to smoothly scroll to 5% of the top
    function smoothScrollTo5Percent() {
        window.scroll({
            top: window.innerHeight * 0.05, // 5% of the viewport height
            behavior: 'smooth' // Smooth scrolling
        });
    }

function postToBlockLength(newBlValue) {
  const url = `/blockLength/${newBlValue}`;
  fetch(url, {
    method: 'POST',
  }).then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    // Handle success
    console.log('Blocks saved successfully');
;})
.catch(error => {
    // Handle errors
    console.error('Error saving blocks:', error);
});
}

    // Function to refresh the time buttons on the user's screen
    function refreshTimeButtons() {
        var timeButtonDiv = document.querySelector('.timeButtonDiv');
        var parent = timeButtonDiv.parentElement;
        parent.removeChild(timeButtonDiv); // Remove the timeButtonDiv

        // Re-create timeButtonDiv
        var newTimeButtonDiv = document.createElement('div');
        newTimeButtonDiv.className = 'timeButtonDiv';
        parent.appendChild(newTimeButtonDiv);

        redrawTimeButtons(); // Call the redraw function to update the time buttons
    }

	function incrementBreakLength(inc) {
		if (breakLength + inc < Math.abs(inc) && inc < 0) {
			if (breakLength == Math.abs(inc)) { breakLength = 5; }
			$('#breakLength').text('− ' + breakLength + ' mins +');
			if (breakLength == 5) { }
		} else {
			breakLength += inc;
			breakLength = Math.floor(breakLength/inc) * inc;
			$('#breakLength').text('− ' + breakLength + ' mins +');
		
			if (breakLength > 60) {
				breakLength = 60 + inc;				
				$('#breakLength').text('Until Morning');
			}
		}

	}

  function toggle(element) {
	if (element.classList.contains("date")) {$(".date").removeClass("toggled"); } 
	if (element.classList.contains("time")) {$(".time").removeClass("toggled"); } 
	element.classList.add('toggled');
	document.getElementById('todo_datetime').value = parseInt($(".toggled.date").attr("days_from_today"))*24*60 + parseInt($(".toggled.time").attr("time_block"));
  }
    // Toggle a Class
    var lastToggleTime = 0;
    var cooldownDuration = 1000; // Cooldown duration in milliseconds
    
    function toggleClass(toggleclass) {
        var currentTime = new Date().getTime();
        
        // Check if enough time has passed since the last toggle
        if (currentTime - lastToggleTime >= cooldownDuration) {
            var toToggle = $('.' + toggleclass);
            toToggle.each(function(index) {
                if ($(this).hasClass('hidden')) {
                    $(this).removeClass('hidden');
                } else {
                    $(this).addClass('hidden');
                }
            });
    
            // Update last toggle time
            lastToggleTime = currentTime;
        }
    }
	function updateTodos() {
		$('.todoTimer').each(
			function updateTodoTimer(index, element) {
				const today = new Date()
				const tomorrow = new Date(today)
				tomorrow.setDate(tomorrow.getDate() + 1)
				var todo_start_time = parseInt($(this).attr('ms_since_epoch'));
				var todo_length_in_ms = parseInt($(this).attr('todo_length')) * 60 * 1000;
				var todo_end_time = todo_start_time + todo_length_in_ms

				if (todo_start_time <= Date.now()) {
					$(this).removeClass('future');
					var new_time = todo_end_time - Date.now();
					if (new_time >= 0){
						$(this).text(msToCountdownString(new_time));
					} else { 
						new_time = 0 
						$(this).text('overdue');
					}
				} else if (todo_start_time <= tomorrow.getTime()) {	
					$(this).text(new Date(todo_start_time).toLocaleTimeString('en-US', {timeStyle: 'short'}));	
				} else {
					$(this).addClass('future');
					$(this).text(new Date(todo_start_time).toLocaleDateString('en-us', { weekday:"long", month:"long", day:"numeric"}));
				} 
			}
		);
		setTimeout(updateTodos, 1000);
	}

	function msToCountdownString(time_in_ms) {		
		var time_in_seconds = parseInt(time_in_ms/1000);
		var minutes = Math.floor(time_in_seconds/60);
		var seconds = time_in_seconds % 60;
		if( seconds < 10 ) { seconds = "0" + seconds; }
		return minutes + ":" + seconds
	}

	function msToTimeString(time_in_ms) {
		var time_in_seconds = parseInt(time_in_ms/1000);
		var hours = Math.floor(time_in_seconds/(60*60));
		var minutes = Math.floor((time_in_seconds - hours*(60*60))%60);
		return hours + ":" + minutes
	}

    // Function to format time as hh:mm AM/PM
    function formatTime(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Handle midnight
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var timeString = hours + ':' + minutes + ' ' + ampm;
        return timeString;
    }

    // Function to redraw the time buttons based on the new block length
    function redrawTimeButtons() {
        const time_block_ms = 1000 * 60 * block_length;
        var time_slots = [];
        const now = new Date(Date.now());
        var hr = 0;
        var min = 0;
        var i = 1;
        while (i < 55) {
            var later_time_ms = Date.now() + i * time_block_ms;
            later_time_ms = Math.round(later_time_ms / time_block_ms) * time_block_ms;
            var later_time = new Date(later_time_ms);
            time_slots.push(later_time);
            min = later_time.getMinutes();
            hr = later_time.getHours();
            i++;
        }

        // Clear the existing buttons
        document.querySelector('.timeButtonDiv').innerHTML = '';

        // Add new buttons
        var timeButtonDiv = document.querySelector('.timeButtonDiv');
        var span = document.createElement('span');

        // Add 'Now' button
        var nowButton = document.createElement('button');
        nowButton.type = 'button';
        nowButton.className = 'time toggled';
        nowButton.setAttribute('time_block', '0');
        nowButton.setAttribute('script', 'if (todayToggled()) {}');
        nowButton.innerHTML = 'Now';
        nowButton.onclick = function() {
            toggle(this);
        };
        span.appendChild(nowButton);

        // Add time slot buttons
        for (var j = 0; j < time_slots.length; j++) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'time slide_item';
            button.setAttribute('time_block', (j + 1) * block_length);
            var button_text = formatTime(time_slots[j]);
            button.innerHTML = button_text;
            button.onclick = function() {
                toggle(this);
            };
            span.appendChild(button);
        }

        timeButtonDiv.appendChild(span);
    }

    // Function to check if today is toggled
    function todayToggled() {
        if ($('#today').classList.contains("toggled")) {
            return true;
        }
        return false;
    }

    // JavaScript function to change the text on hover
function changeText(element) {
    element.innerText = 'no?'; // Change text to 'no?' on hover
}

// JavaScript function to change the text back on mouseout
function changeTextBack(element) {
    element.innerText = 'all done?'; // Change text back to original on mouseout
}


// Break Selector Rocker
function topSelector() {
    var breakSelector = document.querySelector('.breakSelector');
    breakSelector.classList.add('topHovered');
}

function leftSelector() {
    var breakSelector = document.querySelector('.breakSelector');
    breakSelector.classList.add('leftHovered');
}

function rightSelector() {
    var breakSelector = document.querySelector('.breakSelector');
    breakSelector.classList.add('rightHovered');
}

function clearClasses() {
    var breakSelector = document.querySelector('.breakSelector');
    breakSelector.classList.remove('topHovered', 'leftHovered', 'rightHovered');
}

function isObject(variable) {
    return typeof variable === 'object' && variable !== null;
  }