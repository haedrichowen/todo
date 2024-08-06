const express = require('express');
const ejs = require('ejs');
const jsonfile = require('jsonfile');
const fs = require('fs');
const bodyParser = require('body-parser');
const strftime = require('strftime');

const app = express();
const port = 444;
let block_length_minutes;
let todo_db;
let habit_db;
let notesData;

app.use(bodyParser.text({ type: 'text/html' }));
app.use(express.static('./'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

jsonfile.readFile('./data/todo-db.json', function (err, obj) {
  if (err) todo_db = {"table":[]};
  else todo_db = obj;
});

jsonfile.readFile('./data/habit-db.json', function (err, obj) {
  if (err) habit_db = {"table":[]};
  else habit_db = obj;
});

fs.readFile('./data/block_length_minutes.int', { encoding: 'utf8' }, function (err, obj) {
  block_length_minutes = decodeURIComponent(obj);
});

// Default JSON template for notes data
const defaultNotesData = [];

fs.readFile('./data/notes.data', { encoding: 'utf8' }, function (err, data) {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    if (!data) {
        console.log('File is empty, using default template.');
        notesData = defaultNotesData;
        return;
    }

    try {
        notesData = JSON.parse(data);
        console.dir(notesData);
        // Now you can use notesData as an array of note objects
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});

app.get('/', async function (req, res) {
  // Clone the todo_array to keep the original data intact
  const todoArrayClone = JSON.parse(JSON.stringify(todo_db.table));

  // Assuming pushForTodo() updates the db.table asynchronously
  pushForTodo();

  // Render the HTML template with the original todo_array
  const html = await ejs.renderFile(__dirname + '/views/todo/todo.html', {
    strftime,
    todo_array: todoArrayClone, // Pass the original data
    notesData,
    break_length: 20,
    block_length: block_length_minutes,
    nearest_free_time: roundToBlock(nearestFreeTime(Date.now()))
  }, { async: true });

  res.send(html);
});app.get('/', async function (req, res) {
  // Clone the todo_array to keep the original data intact
  const todoArrayClone = JSON.parse(JSON.stringify(todo_db.table));

  // Assuming pushForTodo() updates the db.table asynchronously
  pushForTodo();

  // Render the HTML template with the original todo_array
  const html = await ejs.renderFile(__dirname + '/views/todo/todo.html', {
    strftime,
    todo_array: todoArrayClone, // Pass the original data
    notesData,
    break_length: 20,
    block_length: block_length_minutes,
    nearest_free_time: roundToBlock(nearestFreeTime(Date.now()))
  }, { async: true });

  res.send(html);
});

app.post('/saveNotes', async function (req, res) {
  try {
      const notesData = JSON.stringify(req.body);

      // Write notes HTML to a file
      fs.writeFile('./data/notes.data', notesData, { encoding: 'utf8' }, function (err) {
          if (err) {
              console.error('Error writing file:', err);
              res.status(500).send('Error saving notes');
          } else {
              console.log('File written successfully.');
              res.sendStatus(200);
          }
      });
  } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/archive', async function (req, res) {
  const html = await ejs.renderFile(__dirname + '/views/archive/archive.html', { strftime, todo_array: todo_db.table });
  res.send(html);
});

app.get('/habits', async function (req, res) {
  const html = await ejs.renderFile(__dirname + '/views/habits/habits.html', { strftime, habit_array: habit_db.table, block_length:30 });
  res.send(html);
});

app.get('/break/:minutes', async function (req, res) {
  const break_minutes = req.params.minutes;
  const html = await ejs.renderFile(__dirname + '/views/break/water-procedural-pattern.html', { break_minutes } );
  res.send(html);
});

app.post('/add/:type', async function (req, res) {
    console.log(req.body)
    var { length, text, starttime } = req.body;
    console.log('incoming text ' + text);
    starttime = parseInt(starttime) * 60 * 1000 + Date.now();
    starttime = roundToBlock(starttime);
  if (req.params.type == 'todo') {
    addTodo(text, starttime, length);
  }
  if (req.params.type == 'habit') {
    addHabit(text, starttime, length);
  }
  res.redirect('back');
});

app.post('/blockLength/:newBlValue', async function (req, res) {
  updateblockLength(req.params.newBlValue);
  res.redirect('back');
});

function updateblockLength(str) {
   if (/^\d+$/.test(str)) {
	console.log("new block length set successfully: " + str);
	block_length_minutes = JSON.stringify(parseInt(str, 10));
     fs.writeFile('data/block_length_minutes.int', block_length_minutes, { encoding: 'utf8' }, function (err) {
      if (err) {
        console.error('Error writing file:', err);
      } else {
        console.log('Block length file written successfully.');
       }
    });
  }
  else console.log("new block length fail");
}


app.post('/remove/:type/:id', async function (req, res) {
  if (req.params.type == 'todo') {
    removeTodo(req.params.id);
  }
  if (req.params.type == 'habit') {
    removeHabit(req.params.id);
  }
  res.redirect('back');
});

app.listen(port, () => {
  console.log(`Todo listening on port x${port}`);
});

function addTodo (todo_text, datetime, length) {
  datetime = nearestFreeTime(datetime);
  todo_db.table.push({ created: Date.now(), todo: todo_text, datetime, length });
  sortDB();
  jsonfile.writeFile('data/todo-db.json', todo_db, function(err) { if (err) console.error(err) });
}

function addHabit (habit_text, datetime, length) {
  habit_db.table.push({ created: Date.now(), habit: habit_text, datetime, length });
  jsonfile.writeFile('data/habit-db.json', habit_db, function(err) { if (err) console.error(err) });
}

function removeTodo (todo_id) {
  todo_db.table.splice(todo_id - 1, 1);
  sortDB();
  jsonfile.writeFile('data/todo-db.json', todo_db, function(err) { if (err) console.error(err) });
}

function removeHabit (habit_id) {
  console.log('remove habit: ' + habit_id);
  habit_db.table.splice(habit_id - 1, 1);
  jsonfile.writeFile('data/habit-db.json', habit_db, function(err) { if (err) console.error(err) });
}

function sortDB () {
  todo_db.table.sort((a, b) => (a.datetime - b.datetime));
}

function roundToBlock(time) {
  return Math.round(time / (block_length_minutes * 60 * 1000)) * block_length_minutes * 60 * 1000;
}



let push = false;
function pushForTodo() {
  if (todo_db.table.length <= 0 && push) {
    addTodo("Make a todo.", nearestFreeTime(Date.now() - 60000), (nearestFreeTime(Date.now() + 16 * 60 * 1000) - Date.now())/(60 * 1000));
    push = false;
  }
  if (todo_db.table.length <= 0) push = true;
}

function nearestFreeTime(req_time_ms) {
  let free_time = req_time_ms;
  for (const todo of todo_db.table) {
    if (free_time <= free_time + todo.length * 60 * 1000) free_time += block_length_minutes * 60 * 1000;
  }
  return free_time;
}