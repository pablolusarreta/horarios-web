const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const router = express.Router()


var ini, fin, H3, H5, H8, H12, HM, tmp
ini = fin = H3 = H5 = H8 = H12 = HM = 0
const mismoDia = () => { i = acu.length }

const diaAno = t => {
    let ahora = new Date();
    let comienzo = new Date(t * 1000);
    let dif = ahora - comienzo;
    let unDia = 1000 * 60 * 60 * 24;
    return Math.ceil(dif / unDia);
}

const adjudica = tmp => {
    let hmseg = 3600000;
    if (tmp < 3 * hmseg) { H3++; }
    if (tmp >= 3 * hmseg & tmp < 5 * hmseg) { H5++ }
    if (tmp >= 5 * hmseg & tmp < 8 * hmseg) { H8++ }
    if (tmp >= 8 * hmseg & tmp < 12 * hmseg) { H12++ }
    if (tmp >= 12 * hmseg) { HM++ }
}

router.get('/graficoshorarios', (req, res) => {
    var DATOS = []; var acu = []; var tmpa = []
    H3 = H5 = H8 = H12 = HM = 0
    let ultAno = (new Date().getFullYear() + 1)
    for (let a = 2008; a < ultAno; a++) {
        ini = new Date(a, 0, 1).getTime() / 1000
        fin = new Date((a + 1), 0, 1).getTime() / 1000
        // console.log(ini,fin,new Date(ini * 1000), new Date(fin * 1000))
        if (a < 2014) {
            let db = new sqlite3.Database('./db/fichaje.db', (err) => { if (err) { console.error(err.message) } })
            sql = "SELECT HE1,HS1,HE2,HS2 FROM Horarios WHERE ( HE1>" + ini + " AND HS1<" + fin + " ) OR ( HE2>" + ini + " AND HS2<" + fin + ") ORDER BY HE1,HE2 ASC"
            db.all(sql, [], (err, f) => {
                f.forEach(o => {
                    tmp = ((o.HS1 - o.HE1) + (o.HS2 - o.HE2)) * 1000
                    adjudica(tmp)
                })
                DATOS.push([a, H3, H5, H8, H12, HM])
                H3 = H5 = H8 = H12 = HM = 0
            })
        } else {
            let db = new sqlite3.Database('./db/horarios.db', (err) => { if (err) { console.error(err.message) } })
            sql = "SELECT ID,Tipo FROM Entradas WHERE Grupo=0 AND ID>" + ini + " AND ID<" + fin + " ORDER BY ID ASC"
            db.all(sql, [], (err, f) => {
                f.forEach(o => {
                    if (o.Tipo == 0) {
                        te = o.ID
                        acu.push(te)
                    } else {
                        let i = acu.length
                        tmpa.push((o.ID - te) * 1000)
                        if (diaAno(te) == diaAno(acu[i - 2])) {
                            i = tmpa.length
                            tmp = (tmpa[i - 1]) + (tmpa[i - 2])
                        } else {
                            tmp = tmpa[i - 1]
                        }
                        adjudica(tmp)
                    }
                })
                DATOS.push([a, H3, H5, H8, H12, HM])
                H3 = H5 = H8 = H12 = HM = 0
                //if (a == ultAno-1) {res.json(DATOS.sort())}
            })
        }
    }
    setTimeout(() => { res.json(DATOS.sort()) }, 200)
})




















module.exports = router