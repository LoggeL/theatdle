let roleData = []

const today = new Date()
const seed = parseInt(
  today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0')
)

const x = Math.sin(seed) * 10000
let correctIndex = null

fetch('data.csv')
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
  })

document.getElementById('autocomplete-input').addEventListener('keyup', (e) => {
  // get a list of all the roles
  const roles = roleData.map((r) => ({ jahr: r.Jahr, charakter: r.Charakter }))
  // get the input value
  const input = e.target.value
  // filter the roles
  const filteredRoles = roles.filter((r) => {
    return r.charakter.toLowerCase().includes(input.toLowerCase())
  })

  const autocomplete = document.getElementById('autocomplete')
  autocomplete.innerHTML = ''

  // Fill the top 5
  for (let i = 0; i < 5; i++) {
    autocomplete.innerHTML += filteredRoles[i]
      ? `<a class="row wave" onclick="guessRole('${filteredRoles[i].charakter}', '${filteredRoles[i].jahr}')">
      <div>${filteredRoles[i].jahr}</div>
      <div>${filteredRoles[i].charakter}</div>
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
}
