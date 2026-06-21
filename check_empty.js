const fs = require('fs'); 
const path = require('path'); 
function walk(dir) { 
  let results = []; 
  const list = fs.readdirSync(dir); 
  list.forEach(file => { 
    file = path.join(dir, file); 
    const stat = fs.statSync(file); 
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) { 
      results = results.concat(walk(file)); 
    } else if (file.endsWith('.html')) { 
      results.push(file); 
    } 
  }); 
  return results; 
} 
const files = walk('.'); 
files.forEach(f => { 
  const c = fs.readFileSync(f, 'utf8'); 
  const d1 = c.match(/<div class=\"drop\">([\s\S]*?)<\/div>/g); 
  if (d1) d1.forEach((d, i) => { 
    if (!d.includes('<a ')) console.log(f + ' desktop empty at ' + i); 
  }); 
});
