const uuid = require('uuid');

let userId = '';

if(typeof window !== 'undefined'){
  console.log('have window');
  const stored = window.localStorage.getItem('userId');
  if(stored && stored.length > 0)
    userId = stored;
  else {
    userId = uuid.v4();
    window.localStorage.setItem('userId', userId);
  }
}

module.exports = {
  userId
};

