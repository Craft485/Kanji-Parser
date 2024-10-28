import { readFile, writeFile as write } from 'fs'

const sleep = async (time_ms) => { return new Promise(resolve => setTimeout(resolve, time_ms)) }

// Read in inital file data
async function main() {
    const APIURLBase = 'https://jisho.org/api/v1/search/words?keyword='
    readFile('./heisig-data.txt', { encoding: 'utf-8' }, async (err, fileData) => {
        if (err) throw err

        const fileDataLines = fileData.trim().split('\n')
        let result = ''
        let counter = 0
        for await (const line of fileDataLines) {
            const currLine = []
            const [char, def1, def2, def3] = line.split(':').filter(str => isNaN(Number(str)))
            currLine.push(char, def1)
            if (!currLine.includes(def2)) currLine.push(def2)
            if (!currLine.includes(def3)) currLine.push(def3)
            fetch(APIURLBase + encodeURIComponent(char))
            .then(r => r.json())
            .then(data => {
                if (data.meta.status >= 200 && data.meta.status < 300) {
                    const readings = data.data.map(x => x.japanese.filter(j => j?.word === char)).flat().map(a => a.reading)
                    result += `${currLine.join(':')}:${readings.join(',')}\n`
                    console.log(`${currLine.join(':')}:${readings.join(',')} | ${++counter} / ${fileData.length}`)
                } else {
                    console.error(JSON.stringify(data))
                    process.exit(1)
                }
            })
            await sleep(500)
        }
        write('../out/output.txt', result, { encoding: 'utf-8' }, err => { if (err) throw err })
    })
}

main()