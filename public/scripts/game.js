// Get canvas and graphics context
const canvas = document.getElementById("game-screen");
const g = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;
canvas.style.backgroundColor = "white";

// Engine stuff
const State = {Start: 0, Play: 1, GameOver: 2}

let prev_time = performance.now();
let state = State.Start;
let last_state;
let states = {};

class AnimBar {
	constructor(value, target, accel) {
		this.value = value;
		this.target = target;
		this.accel = accel; // Anim speed
	}

	update(delta) {
		this.value += (this.target - this.value) * this.accel * delta;
	}
}

const colours = ["black", "#f00", "#ff0", "#0f0", "#0ff", "#00f", "#f0f"];

// Game variables
let score;
const BONUS_MAX = 5;
const BONUS_TIME = 8;
let bonus_progress;
let bonus_stage;
let bonus_bar;
let time_remaining;
const words = ["Proboscis Monkey", "Elephant Seal", "Naked Mole-Rat", "Monkfish", "Shoebill", "Sphynx Cat", "Goblin Shark", "Warthog"];
let word_index;
let current_word;
let current_char;


states[State.Start] = {
	load: () => {
		g.font = "32px sans-serif";
		g.textAlign = "center";
	},
	
	update: (delta) => {},

	draw: () => {
		g.fillText("Type the animal names shown!", canvas.width * 0.5, canvas.height * 0.4);
		g.fillText("Do as many as you can before time runs out!", canvas.width * 0.5, canvas.height * 0.4 + 36);
		g.fillText("Press any key to start!", canvas.width * 0.5, canvas.height * 0.75);
	},

	keypressed: (e) => {
		state = State.Play;
	},
}


states[State.Play] = {
	load: () => {
		score = 0;
		time_remaining = 25;
		current_char = 0;
		word_index = Math.floor(Math.random() * words.length); // Pick a random word.
		current_word = words[word_index];
		bonus_progress = 0;
		bonus_bar = new AnimBar(0, 0, 6.5);
		bonus_stage = 1;

		g.font = "48px impact";
		g.textAlign = "center";
	},

	update: (delta) => {
		time_remaining -= delta;

		if (time_remaining <= 0) {
			state = State.GameOver;
		}

		bonus_bar.update(delta);
		if (bonus_bar.value >= BONUS_MAX - 0.05) {
			bonus_bar.target = 0;
			bonus_bar.value = 0;
			bonus_stage = Math.min(bonus_stage + 1, colours.length);
		}
	},

	draw: () => {
		g.fillStyle = colours[bonus_stage - 1];
		g.fillRect(0, canvas.height - 80, canvas.width, 80);
		g.fillStyle = colours[bonus_stage];
		g.fillRect(0, canvas.height - 80, bonus_bar.value / BONUS_MAX * canvas.width, 80);

		if (bonus_stage == colours.length) {
			g.fillStyle = "white";
			g.fillText("MAX BONUS!!!", canvas.width * 0.5, canvas.height - 20);
		}

		g.fillStyle = "black";
		g.fillText(Math.ceil(time_remaining), canvas.width * 0.5, 80);

		g.fillText(current_word, canvas.width * 0.5, canvas.height * 0.5);
		g.fillStyle = "red";
		g.fillText(current_word.substring(0, current_char), canvas.width * 0.5, canvas.height * 0.75);
	},

	keypressed: (e) => {
		if (e.key.toLowerCase() == current_word[current_char].toLowerCase()) {
			current_char += 1;
			if (current_char >= current_word.length) {
				// End of the word so pick a new one.
				word_index = Math.floor(Math.random() * words.length); // Pick a random word.
				current_word = words[word_index];
				current_char = 0;
				score += 1;

				// Only check for bonus if not maxed out
				if (bonus_stage < colours.length) {
					bonus_progress += 1;
					bonus_bar.target = bonus_progress;
	
					// Every fifth word correct gets extra time
					if (bonus_progress == BONUS_MAX) {
						bonus_progress = 0;
						time_remaining += BONUS_TIME;
					}
				}
			}
		}
	},
}


states[State.GameOver] = {
	load: () => {
		g.font = "48px impact";
		g.textAlign = "center";
		g.fillStyle = "black";
	},

	update: (delta) => {},

	draw: () => {
		g.font = "48px impact";
		g.textAlign = "center";
		g.fillText("Congratulations!", canvas.width * 0.5, canvas.height * 0.25);
		g.fillText(`You scored ${score}!`, canvas.width * 0.5, canvas.height * 0.5);
		g.fillText("Press the return key to restart!", canvas.width * 0.5, canvas.height * 0.75);
	},

	keypressed: (e) => {
		if (e.key == "Enter") {
			state = State.Play;
		}
	},
}


// The "game engine"
function update() {
	// Work out frame time so that timers are accurate accross different computers
	let curr_time = performance.now();
	let delta = (curr_time - prev_time) / 1000;
	prev_time = curr_time;

	// Hack: Run the state load function if the state has changed
	if (last_state != state) {
		states[state].load();
		last_state = state;
	}

	states[state].update(delta);

	g.clearRect(0, 0, canvas.width, canvas.height); // Clear last frame
	states[state].draw();

	window.requestAnimationFrame(update); // Schedule game update
}

window.addEventListener("keydown", (e) => {
	// This should really only listen for keypresses when the canvas is focused
	states[state].keypressed(e); // Forward keypresses to active state
});

window.requestAnimationFrame(update); // Start the game