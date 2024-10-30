const { readFile, writeFile:write } = require('fs')
const { get } = require('axios')
const { load } = require('cheerio')

const sleep = async (time_ms) => new Promise(resolve => setTimeout(resolve, time_ms))

function main() {
    const baseURL = 'https://jisho.org/search/'
    let result = ''
    readFile('./heisig-data.txt', { encoding: 'utf-8' }, async (err, fileData) => {
        if (err) throw err

        const lines = fileData.trim().split('\n')
        const headers = [ lines.shift(), lines.shift() ]
        console.debug(headers.join('\n'))
        for (let i = 0; i < lines.length; i++) {
            const currLine = lines[i]
            const [ char, def1, def2, def3 ] = currLine.split(':').filter(str => isNaN(Number(str)))
            const definitions = [ def1 ]
            if (!definitions.includes(def2)) definitions.push(def2)
            if (!definitions.includes(def3)) definitions.push(def3)
            const response = await get(baseURL + encodeURIComponent(`${char} #kanji`), { headers: { "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36' } })
            if (response.status >= 200 && response.status < 300) {
                const $ = load(response.data)
                const readings = []
                for (const element of $('dd.kanji-details__main-readings-list')) {
                    const data = $(element).text().trim().split('、').map(s => s.trim())
                    readings.push(data.join(','))
                }
                const newLine = `${char}:${definitions.join(',')}:${readings.join(':')}`
                result += newLine + '\n'
                console.debug(`${newLine} | ${i + 1} / ${lines.length} (${((i + 1) / lines.length * 100).toFixed(2)}%)`)
            } else {
                console.error(JSON.stringify(response))
                write('../out/output.scrape.txt', result, { encoding: 'utf-8' }, err => { if (err) throw err })
                process.exit(1)
            }
            await sleep(5000)
        }
        write('../out/output.scrape.txt', result, { encoding: 'utf-8' }, err => { if (err) throw err })
    })
}

main()
