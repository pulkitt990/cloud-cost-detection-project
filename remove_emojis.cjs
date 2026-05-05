const fs = require('fs');

const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;

const files = [
  'login.html', 'index.html', 'employee.html',
  'src/login.js', 'src/main.js', 'src/employee.js'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Selective replacements for specific emojis that we want to turn into text 
  // or leave alone, before we wipe the rest.
  
  // Favicons
  content = content.replace(/<text y='\.9em' font-size='90'>☁️<\/text>/g, "<text y='.9em' font-size='90'>☁️</text>"); // keep it
  
  // Remove all other emojis
  content = content.replace(emojiRegex, (match, offset, str) => {
    // Keep favicon cloud
    const context = str.substring(Math.max(0, offset - 20), offset + 20);
    if (context.includes("font-size='90'")) return match;
    
    // Convert theme icons to text if we want, but removing them is fine.
    // The user said "remove emojies".
    return '';
  });
  
  // Clean up double spaces left by emoji removal
  content = content.replace(/  +/g, ' ');
  // Clean up trailing spaces before HTML tags or newlines
  content = content.replace(/ </g, '<');
  
  fs.writeFileSync(file, content);
  console.log(`Cleaned ${file}`);
});
