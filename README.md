# The glorious, amazingly innovative viktor lock


## Testing instructions
### Installing Node.js
This project runs on Node.js so you need to install node.  
To install node, go to [the downloads page](https://nodejs.org/en/download/) and download the latest node version in the 8.x.x range.

### Setup
After installing Node.js, go to the folder where you extracted the contents of backend.zip.
In this folder, run `npm install` this will download all of the dependencies for the project.

### Arduino
After the dependencies have been installed, you are almost ready to run the code, make sure you connect the arduino and upload the right script to it using the arduino IDE. The script can be found in arduino.zip. Also find out what port the arduino is connected to. On my (macOS) computer, this was the path `/dev/tty.usbmodem14621`.

### Running
After getting the arduino setup, you are ready to run the server. Go to the backend folder and run  
`node src/index.js --port $PORT -d $PATH_TO_DATABASE -s $PATH_TO_ARDUINO_PORT -p $PATH_TO_PASSWORD_FILE`  
Don't forget to replace all variables starting with `$` with actual values. Everything except for `$PATH_TO_ARDUINO_PORT` can be omitted to use defaults.

### Testing
When the server is up and running, go ahead and place a tag on the scanner, you will hear three short beeps, these indicate that the pass was denied, this is because it has not yet been added to a user in the database.  

All actions are done through the API, some minimal documentation below:

## API documentation

Endpoints:
- `/entries`
- `/user`
- `/pass`
- `/adminpassword`

All requests should be accompanied by a header called `x-auth`, the value for this header should be the admin password. By default this password is 'hunter2' (no quotes).  

###### Curl example:  
`curl -H 'x-auth: hunter2' ....`  

#### `/entries` - `GET`
This endpoint returns an array with all the users, a user object looks like the following:
```js
{
  name: 'Johnny Appleseed',   // must be unique
  passIDs: [123123123, 123113312],    // list of ids of passes that belong to this user
  startTime: 36000000, // the time in ms since the start of the day after which the user can open the door
  endTime: 68400000    // the time in ms since the start of the day after which the user can no longer open the door
}
```

###### Curl example:  
```
curl -H 'x-auth: hunter2' localhost:8080/entries
```

#### `/user` - `POST`
Posting to this endpoint will add a user to the database.  
This endpoint requires some query parameters:
- `username`: a unique username for a user
- `startTime`: the startTime for the user
- `endTime`: the endTime for the user

###### Curl example:  
```sh
curl -X POST -H 'x-auth: hunter2' \
'localhost:8080/user?username=Johnny+Appleseed&startTime=36000000&endTime=68400000'
```

#### `/user` - `DELETE`
A delete request will remove a user and all the information associated with that user from the database.  
This endpoint requires one query parameter: `username`, this is the username of the user in the database.

###### Curl example:  
```sh
curl -X DELETE -H 'x-auth: hunter2' \
'localhost:8080/user?username=Johnny+Appleseed'
```

#### `/pass` - `PUT`
This endpoint adds a pass to a user, the way it works is you make the request and then you scan a pass on the Arduino.  
The endpoint has one query parameter: `username`, the username of the user the pass should be added to.

###### Curl example:  
```sh
curl -X PUT -H 'x-auth: hunter2' \
'localhost:8080/pass?username=Johnny+Appleseed'
```

#### `/pass` - `DELETE`
This endpoint removes a pass from a user.  
The endpoint has two query parameters:
- `username`: username of the user
- `pass`: id of pass

###### Curl example:  
```sh
curl -X DELETE -H 'x-auth: hunter2' \
'localhost:8080/pass?username=Johnny+Appleseed&pass=123123123'
```

#### `/adminpassword` - `PUT`
This endpoint changed the admin password.  
It has one query parameter: `password`, the new password.

###### Curl example:  
```sh
curl -X PUT -H 'x-auth: hunter2' \
'localhost:8080/adminpassword?password=a+better+password'
```

## License
This project was brought to you by the kind folks of the viktor working group.

This group consists of: Jim Damman, Mees van Dijk, Loek van der Gugten, Tijmen Krijnen, Shan-wei Mensing and Sytze de Witte

MIT © The viktor working group
