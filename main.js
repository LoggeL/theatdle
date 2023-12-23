let roleData = []

const today = new Date()
const seed = parseInt(
  today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0')
)

const x = Math.sin(seed) * 10000
let correctIndex = null

let guesses = []

fetch(
  'https://docs.google.com/spreadsheets/d/1fLlhPInXTClHR5bMcjY90JHVj3vGarUZMtmFDrbRwK4/pub?output=csv'
)
  .then((response) => {
    return response.text()
  })
  .then((data) => {
    // Parse csv
    const headers = data.split('\n')[0].split(',')
    const rows = data.split('\n').slice(1)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].split(',')
      const obj = {}
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j].replace('\r', '')
      }
      roleData.push(obj)
    }
    correctIndex = Math.floor((x - Math.floor(x)) * roleData.length)

    // Check history
    const history = localStorage.getItem('history')
    if (history) {
      // Compare history.date with today
      const historyDate = new Date(JSON.parse(history).date)
      if (
        historyDate.getFullYear() === today.getFullYear() &&
        historyDate.getMonth() === today.getMonth() &&
        historyDate.getDate() === today.getDate()
      ) {
        // Same day, use history to load guesses
        const historyData = JSON.parse(history).data
        for (let i = 0; i < historyData.length; i++) {
          const data = historyData[i]
          guessRole(data.charakter, data.jahr)
        }
      }
    }
  })

document.getElementById('autocomplete-input').addEventListener('keyup', (e) => {
  // get a list of all the roles
  const roles = roleData.map((r) => ({
    jahr: r.Jahr,
    charakter: r.Charakter,
    person: r.Schauspieler,
  }))
  // get the input value
  const input = e.target.value
  // filter the roles using stringSimilarity.findBestMatch
  const filteredRoles = stringSimilarity
    .findBestMatch(
      input,
      roles.map((r) => `${r.jahr};${r.charakter};${r.person}`)
    )
    .ratings.sort((a, b) => b.rating - a.rating)
    .map((r) => {
      const [jahr, charakter, person] = r.target.split(';')
      return { jahr, charakter, person }
    })

  const autocomplete = document.getElementById('autocomplete')
  autocomplete.innerHTML = ''

  // Fill the top 5
  for (let i = 0; i < filteredRoles.length; i++) {
    autocomplete.innerHTML += filteredRoles[i]
      ? `<a class="row wave" onclick="guessRole('${filteredRoles[i].charakter}', '${filteredRoles[i].jahr}')">
      <div>${filteredRoles[i].jahr}</div>
      <div>${filteredRoles[i].charakter}</div>
      <div>(${filteredRoles[i].person})</div>
    </a>`
      : ''
  }
})

function guessRole(role, year) {
  const correctRole = roleData[correctIndex]
  const guessedRole = roleData.find(
    (r) => r.Charakter == role && r.Jahr == year
  )
  // Return array with correct, partial, and incorrect

  let response = {}
  for (const key in guessedRole) {
    if (correctRole[key] === guessedRole[key]) {
      response[key] = 'green'
    }
    // Partial match
    else if (
      correctRole[key].includes(guessedRole[key]) ||
      guessedRole[key].includes(correctRole[key])
    ) {
      response[key] = 'yellow'
    } else {
      response[key] = 'red'
    }
  }

  let tableString = '<tr>'
  for (const key in guessedRole) {
    if (key === 'Jahr') continue
    // Add tr
    const capitalizedValue =
      guessedRole[key].charAt(0).toUpperCase() + guessedRole[key].slice(1)
    tableString += `<td>
    <article class="${response[key]}">
      <div class="center-align">${capitalizedValue}</div>
    </article>
  </td>`
  }

  //   Empty autocomplete
  document.getElementById('autocomplete').innerHTML = ''
  document.getElementById('autocomplete-input').value = ''

  document.getElementsByTagName('tbody')[0].innerHTML += tableString + '</tr>'

  // If all correct, remove input and autocomplete
  console.log(response)
  if (Object.values(response).every((v) => v === 'green')) {
    document.getElementById('autocomplete-input').remove()
    document.getElementById('autocomplete').remove()

    // Alert
    const numTries = document.getElementsByTagName('tbody')[0].children.length
    alert(
      `Korrekt! Du hast die Rolle erraten! Du hast ${numTries} Versuche gebraucht.`
    )

    // Fill share area
    const shareArea = document.getElementById('share')
    const shareContainer = document.getElementById('share-container')
    shareContainer.style.display = 'block'
    // Fill with emojis
    shareArea.value = ``
    const articles = document.querySelectorAll('article')
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      const color = article.classList[0]
      if (color === 'green') {
        shareArea.value += '🟩'
      } else if (color === 'yellow') {
        shareArea.value += '🟨'
      } else {
        shareArea.value += '🟥'
      }
      if ((i + 1) % 8 === 0) {
        shareArea.value += '\n'
        shareArea.style.height = i / 8 + 1 + 'em'
      }
    }
  }

  guesses.push({ charakter: role, jahr: year })
  localStorage.setItem(
    'history',
    JSON.stringify({ date: today, data: guesses })
  )
}

document.getElementById('share-button').addEventListener('click', (e) => {
  const shareArea = document.getElementById('share')
  shareArea.select()
  shareArea.setSelectionRange(0, 99999)
  document.execCommand('copy')
  alert('Kopiert!')
})
