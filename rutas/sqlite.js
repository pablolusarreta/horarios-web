const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const router = express.Router()
const urldb = './db/'

let condicion, Mconfig, Mentradas, Mnotas, Mdias, Mmeses, sql
const autf8 = s => { return s.replace('Ã¡', 'á').replace('Ã³', 'ó').replace('Ã±', 'ñ') }

////////////////////////////////////////////////////////
router.get('/editor', (req, res) => {
    //ABRIR DB
    let db = new sqlite3.Database(urldb + 'horarios.db', (err) => { if (err) { console.error(err.message) } })
    if (req.query.accion) {
        switch (req.query.accion) {
            case '0':
                condicion = `WHERE Grupo=${req.query.grupo} AND ID>${req.query.ini} AND ID<${req.query.fin} ORDER BY ID ASC`
                Mconfig = []; Mentradas = []; Mnotas = []; Mdias = [];
                //  NORMAS
                sql = `SELECT * FROM Configuracion WHERE Grupo=${req.query.grupo} ORDER BY ID ASC`
                db.all(sql, [], (err, f) => {
                    f.forEach(o => {
                        Mconfig.push([o.ID, o.Texto, o.Valor1, o.Valor2])
                    })
                    //  ENTRADAS
                    sql = `SELECT ID,Tipo FROM Entradas ${condicion}`
                    db.all(sql, [], (err, f) => {
                        f.forEach(o => {
                            Mentradas.push([o.ID, o.Tipo])
                        })
                        //  NOTAS
                        sql = `SELECT ID,Texto FROM Notas ${condicion}`
                        db.all(sql, [], (err, f) => {
                            f.forEach(o => {
                                Mnotas.push([o.ID, autf8(o.Texto)])
                            })
                            //  DIAS
                            sql = `SELECT ID,IDD FROM Dias ${condicion}`
                            db.all(sql, [], (err, f) => {
                                f.forEach(o => {
                                    Mdias.push([o.ID, o.IDD])
                                })
                                //  ANUAL TEORICO
                                let ano = new Date((Number(req.query.fin) * 1000)).getFullYear();
                                let tini = new Date(ano, 0, 0, 24, 0, 0, 0).getTime()
                                let tfin = new Date((ano + 1), 0, 0, 24, 0, 0, 0).getTime()
                                sql = `SELECT ID FROM Dias WHERE Grupo=${req.query.grupo} AND ID>${tini / 1000} AND ID<${tfin / 1000} AND IDD>203 AND IDD<300 AND IDD!=209 AND IDD!=210`
                                db.all(sql, [], (err, f) => {
                                    //  RESPUAESTA
                                    res.json({ Configuracion: Mconfig, Marcas: Mentradas, Notas: Mnotas, Dias: Mdias, DNTano: f.length })
                                })
                            })
                        })
                    })
                })
                break
            case '1':
                switch (req.query.tabla) {
                    case 'Entradas':
                        sql = `DELETE FROM Entradas WHERE Grupo="${req.query.grupo}" AND ID=${req.query.id}`
                        db.run(sql)
                        sql = `INSERT INTO Entradas VALUES("${req.query.valor}", "${req.query.tipo}", "${req.query.grupo}")`
                        break;
                    case 'Notas':
                        sql = `DELETE FROM Notas WHERE Grupo="${req.query.grupo}" AND ID=${req.query.id}`
                        db.run(sql)
                        if ((req.query.valor.trim()) != '') {
                            sql = `INSERT INTO Notas VALUES(${req.query.id},'${req.query.valor}',${req.query.grupo})`
                        }
                        break;
                    case 'Dias':
                        sql = `DELETE FROM Dias WHERE Grupo=${req.query.grupo} AND ID=${req.query.id}`
                        db.run(sql)
                        if (req.query.valor > 201) {
                            sql = `INSERT INTO Dias VALUES(${req.query.id},'${req.query.valor}',${req.query.grupo})`
                        }
                        break;
                }
                db.run(sql, (err) => { if (err) { console.log(err) } res.json({ error: false }); console.log(sql) })
                break
            case '2':
                sql = `DELETE FROM Entradas WHERE Grupo=${req.query.grupo} AND ID=${req.query.id}`
                db.run(sql)
                res.json({ error: false })
                break
            case '3':
                condicion = `WHERE Grupo=${req.query.grupo} AND ID>=${req.query.ini} AND ID<${req.query.fin} ORDER BY ID ASC`
                Mmeses = Mdias = []
                sql = `SELECT ID,DiasLaborables,HorasTrabajadas FROM Meses ${condicion}`
                db.all(sql, [], (err, f) => {
                    f.forEach(o => {
                        Mmeses.push([o.ID, o.DiasLaborables, o.HorasTrabajadas])
                    })
                    sql = `SELECT ID,IDD FROM Dias ${condicion}`
                    db.all(sql, [], (err, f) => {
                        f.forEach(o => {
                            Mdias.push([o.ID, o.IDD])
                        })
                        res.json({ Meses: Mmeses, Dias: Mdias })
                    })
                })
                break
            case '4':
                Mconfig = []
                sql = `SELECT * FROM Configuracion WHERE Grupo=${req.query.grupo} ORDER BY ID ASC`
                db.all(sql, [], (err, f) => {
                    f.forEach(o => {
                        Mconfig.push([o.ID, o.Texto, o.Valor1, o.Valor2])
                    })
                    res.json(Mconfig)
                })
                break
            case '5':
                sql = `UPDATE Configuracion SET Valor2='${req.query.valor}' WHERE Grupo=${req.query.grupo} AND ID=${req.query.id}`
                db.run(sql)
                res.json({ error: false })
                break
            case '6':
                sql = `DELETE FROM Meses WHERE Grupo=${req.query.grupo} AND ID=${req.query.id}`
                db.run(sql)
                sql = `INSERT INTO Meses VALUES(${req.query.id},${req.query.v1},${req.query.v2},${req.query.grupo})`
                db.run(sql)
                res.json({ error: false })
                break
            case '7':
                condicion = `WHERE Grupo=${req.query.grupo} AND ID>${req.query.ini} AND ID<${req.query.fin} ORDER BY ID ASC`
                Mentradas = []; Mnotas = []; Mdias = [];
                //  ENTRADAS
                sql = `SELECT ID,Tipo FROM Entradas ${condicion}`
                db.all(sql, [], (err, f) => {
                    f.forEach(o => {
                        Mentradas.push([o.ID, o.Tipo])
                    })
                    //  NOTAS
                    sql = `SELECT ID,Texto FROM Notas WHERE Grupo=${req.query.grupo} AND ID=${req.query.ini}`
                    console.log(sql)
                    db.all(sql, [], (err, f) => {
                        f.forEach(o => {
                            Mnotas.push([o.ID, autf8(o.Texto)])
                        })
                        res.json({ Marcas: Mentradas, Notas: Mnotas })
                    })
                })
                break
        }
    } else {
        let Os = { Grupo: [], Tipo: [[0, "Entrada"], [1, "Salida"], [2, "Marca"]] }
        db.all("SELECT ID,Nombre,imagenB64MIME,imagenB64DATA FROM Grupo WHERE IDUsuario='plusarreta' ORDER BY ID ASC", [], (err, f) => {
            f.forEach(c => {
                Os.Grupo.push([c.ID, c.Nombre, c.imagenB64MIME, c.imagenB64DATA])
            })
            res.json(Os)
        })
    }
    //CERRAR DB
    db.close((err) => { if (err) { console.error(err.message) } })
})
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
router.get('/autentificacion', (req, res) => {
    if (req.query.usuario == 'plusarreta' & req.query.contrasena == 'pabl8173') {
        res.json({ autentico: true })
    } else {
        res.json({ autentico: false })
    }
})
////////////////////////////////////////////////////////
router.get('/horarios.db', (req, res) => {
    res.sendFile('horarios.db', { root: path.join(__dirname, '../db') })
})
module.exports = router