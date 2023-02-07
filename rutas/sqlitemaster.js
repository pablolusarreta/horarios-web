const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const router = express.Router()
const fs = require('fs')
const path = require('path')

let baseDatos, tablas, tabla, campos

const extCampos = (sql, t) => {
    let m = sql.split(t)[1].trim().replace(/\(|\)/g, '').split(',')
    campos = []
    let arg, atr, camp
    m.forEach(ele => {
        arg = ele.trim().split(" ")
        camp = {
            nombre: arg[0].trim(),
            tipo: arg[1].trim(),
            caracteres: 14,
            NN: false,
            PK: false,
            AI: false,
            U: false
        }
        if (arg.length > 2) {
            if (isNaN(Number(arg[2].trim()))) {
                atr = arg.slice(2)
            } else {
                camp.caracteres = Number(arg[2].trim())
                atr = arg.slice(3)
            }
            atr = atr.toString().replace(/,/g, ' ')
            camp.NN = (atr.match(/NOT NULL/g)) ? true : false
            camp.PK = (atr.match(/PRIMARY KEY/g)) ? true : false
            camp.AI = (atr.match(/AUTOINCREMENT/g)) ? true : false
            camp.U = (atr.match(/UNIQUE/g)) ? true : false
        }
        campos.push(camp)
    })
    return campos
}
//------------------------------------------ B A S E S   D E   D A T O S
router.get('/dbs', async (req, res) => {
    fs.readdir(path.join(__dirname, "/../db/"), (err, archivos) => {
        if (err) { console.error(err.message) }
        res.json(archivos);
    })
})
router.get('/sqliteTablas', (req, res) => {
    if (!req.query.db) {
        res.json({ "error": "Se necesita la variable <db> en la ruta..", "ejemplo": "http://localhost:3000/sqliteTablas?db=db/horarios.db" })
    }
    baseDatos = req.query.db
    tablas = []
    let db = new sqlite3.Database(req.query.db, (err) => { })
    db.all("SELECT * FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) { console.error(err.message) }
        rows.forEach(row => {
            tablas.push(row.name)
        })
        res.json(tablas)
    })
    db.close((err) => { if (err) { console.error(err.message) } })
})
//-------------------------------------------
router.get('/sqliteTabla', (req, res) => {
    if (!req.query.db) {
        res.json({ "error": "Se necesitan las variables <db> y <t> en la ruta..", "ejemplo": "http://localhost:3000/sqliteTabla?db=db/horarios.db&t=Configuracion" })
    }
    let db = new sqlite3.Database(req.query.db, (err) => { })
    db.all(`SELECT * FROM sqlite_master WHERE type='table' AND name='${req.query.t}'`, [], (err, rows) => {
        if (err) { console.error(err.message) }
        rows.forEach(row => {
            tabla = row
            db.each(`SELECT * FROM ${row.name}`, elemen => { tabla.campo = elemen })
        })
        tabla.PK = (tabla.sql.match(/PRIMARY KEY/g)) ? true : false
        tabla.sql = tabla.sql.replace(/\"|\t|\n/g,' ')
        tabla.campos = extCampos(tabla.sql, req.query.t)
        res.json(tabla)
    })
    db.close((err) => { if (err) { console.error(err.message) } })
})
//---------- S E L E C T
router.get('/select', async (req, res) => {
    try {
        let db = new sqlite3.Database('./db/horarios.db')
        db.all("SELECT * FROM " + req.query.t, [], (err, rows) => {
            if (err) { console.error(err.message) }           
            res.json(rows)
        })
        db.close()
    } catch (e) {
        console.log(e)
        res.status(500).send('error')
    }
})
//---------- C R U D 
//          UPDATE Configuracion SET Texto='Asuntos propios y trienios' WHERE ID=204;
router.get('/crud', async (req, res) => {
    try {      
        let db = new sqlite3.Database('./db/horarios.db')
        let sql = decodeURI(req.query.SQL)
        res.json({ "SQL": sql, "estado": true })
        await db.run(sql)
        db.close()
        //res.send({ "estado": true }) // =>
    } catch (e) {
        console.log(e)
        res.status(500).send('Problema con el SQL')
    }
})
////////////////////////////////////////////////////////////
router.get('/infoDB', (req, res) => {
    if (!req.query.db) {
        res.json({ "error": "Se necesita la variable <db> en la ruta..", "ejemplo": "http://localhost:3000/infoDB?db=db/horarios.db" })
    }
    baseDatos = req.query.db
    tabla = []
    let db = new sqlite3.Database(req.query.db, (err) => { })
    db.all("SELECT * FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) { console.error(err.message) }
        rows.forEach(row => {
            tabla.push({ 'tabla': row })
            for (let i in tabla) {
                db.each(`SELECT * FROM ${tabla[i].tabla.name}`, (err, row) => {
                    if (err) { console.error(err.message) }
                    tabla[i].tabla.campo = row
                })
            }
        })
        res.json(tabla)
    })
    db.close((err) => { if (err) { console.error(err.message) } })
})

module.exports = router
