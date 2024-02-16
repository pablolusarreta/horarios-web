const contenido = (ruta, funcion) => {
	if (!funcion) funcion = () => { return false }
	fetch(ruta)
		.then(res => res.json())
		.then(datos => { funcion(datos) });
}
///////////////////////////////////////////////////////////////////
var DH = new Date();
var actual = {
	fecha: [DH.getFullYear(), DH.getMonth(), 1, 0, 0, 0, 0],
	diasMes: 27,
	grupo: 0,
	id: 0,
	idMes: 0,
};
var anual = new Object();
var mensual = new Object();
var DATOS;
var MES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
var DSEMANA = ['Domingo', 'Lunes', 'Martes', 'Mi&eacute;rcoles', 'Jueves', 'Viernes', 'S&aacute;bado'];
//informe.htm
let informe_estilo = false
let informe_mes = false
//ARRANQUE///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const menu = datos => {
	DATOS = datos
	if (DATOS.Error) {
		if (confirm(DATOS.Error)) {
			location.assign('../sustapena/');
		} else {
			cargando(0);
		}
		return false;
	}
	var tmp = '';
	for (var i in DATOS.Grupo) {
		tmp += '<div class="opcion">';
		tmp += '<img src="data:' + DATOS.Grupo[i][2] + ';base64,' + DATOS.Grupo[i][3] + '" />';
		tmp += '<span>' + DATOS.Grupo[i][1] + '<br><button onclick="cargaGrupo(' + DATOS.Grupo[i][0] + ',0,mes);">Marcajes</button><br>';
		tmp += '<button onclick="cargaGrupo(' + DATOS.Grupo[i][0] + ',4,configuracion);">Configuración</button></span></div>';
	}
	document.getElementById('salida').innerHTML = tmp;
	cargando(0)
	//informe.htm
	if (informe_mes) { informe_mes() }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const editor_marcajes = () => {
	var sel = '';
	var selector = '<div id="navegador"><span onclick="inicia();">Inicio &raquo;</span><span class="activo">Marcajes ' + DATOS.Grupo[actual.grupo][1] + '</span></div>';
	if (DATOS.Grupo[actual.grupo][1] == 'Sarobe') {
		selector += '<div id="graficos"> <a href="/graficoshorarios.htm" target="_blank">Horarios jornada-anuales</a>'
		selector += '<a href="/informe.htm" target="_blank">Informe-mes</a>'
		//selector += '<a href="/graficoshorarios.htm" target="_blank">Fines de semana-anuales</a>'
		selector += '<a href="/horarios.db" target="_blank">Descargar DB</a></div>'
	}
	selector += '<div id="selectores"><select onchange="actual.fecha[1]=Number(this.value);cargaGrupo(actual.grupo,0,mes);editor_marcajes();">';
	for (var i = 0; i < 12; i++) {
		sel = (i == actual.fecha[1]) ? 'selected' : '';
		selector += '<option value="' + i + '" ' + sel + '> ' + MES[i] + '</option>';
	}
	selector += '</select>';
	selector += '<select onchange="actual.fecha[0]=Number(this.value);cargaGrupo(actual.grupo,0,mes);editor_marcajes();">';
	for (var i = 2014; i <= (new Date().getFullYear()); i++) {
		sel = (i == actual.fecha[0]) ? 'selected' : '';
		selector += '<option value="' + i + '" ' + sel + '> ' + i + '</option>';
	}
	selector += '</select>';
	for (actual.diasMes = 27; actual.diasMes < 33; actual.diasMes++) {
		var tmp = new Date(actual.fecha[0], actual.fecha[1], actual.diasMes);
		if (tmp.getDate() == 1 || actual.diasMes > 31) { actual.diasMes--; break; }
	}
	selector += '<button onclick="cargaGrupo(' + actual.grupo + ',3,ano);">Anual</button>';
	selector += '<button onclick="window.print();">IMPRIMIR</button></div>';

	document.getElementById('control').innerHTML = selector;
	var tmp = new Date(actual.fecha[0], actual.fecha[1] + 1, 0, 0, 0, 0, 0);
	var mes_numero = tmp.getMonth() + 1;
	document.title = tmp.getFullYear() + ' ' + ((mes_numero < 10) ? '0' + String(mes_numero) : mes_numero) + ' ' + MES[tmp.getMonth()];
}
// TEORICOS ANUALES
const datos_anuales_teoricos = () => {
	var ini = new Date(actual.fecha[0], 0, 1, 0, 0, 0);
	var fin = new Date(actual.fecha[0] + 1, 0, 1, 0, 0, 0);
	anual.sabados = anual.domingos = anual.dias = 0;

	for (var i = ini.getTime(); i < fin.getTime(); i += (24 * 60 * 60 * 1000)) {
		var tmp = new Date(i);
		anual.sabados = (tmp.getDay() == 6) ? anual.sabados + 1 : anual.sabados;
		anual.domingos = (tmp.getDay() == 0) ? anual.domingos + 1 : anual.domingos;
		anual.dias += 1;
	}
	anual.fines_semana = (Config[105][2] < 6) ? (anual.sabados + anual.domingos) : anual.domingos;
	anual.laborables = (anual.dias - anual.fines_semana - Config[202][2] - Config[203][2]);
	anual.horas_ano = (Config[106][2] * Config[107][2]) / 100;
	anual.horas_dia = (anual.horas_ano * 3600000) / (anual.laborables/* + DATOS.Entradas.DNTano*/);
	//console.log(anual.dias + '-' + anual.fines_semana + '-' + Config[202][2] + '-' + Config[203][2] + '=' + anual.laborables);
}
// CREANDO UN MES ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var Config, HN, HE
const mes = datos => {
	DATOS.Entradas = datos
	//console.log(DATOS)
	// INICIALIZAR
	editor_marcajes();
	mensual.dias_no_lab = mensual.horas_trab = 0;
	if (DATOS.Entradas.Incidencia) { var vacio = true; } else { var vacio = false; }
	// VARIABLES TEMPORALES ARRAY -> CONFIG[ID]
	Config = new Array();
	for (var m in DATOS.Entradas.Configuracion) {
		Config[DATOS.Entradas.Configuracion[m][0]] = [DATOS.Entradas.Configuracion[m][1], DATOS.Entradas.Configuracion[m][2], DATOS.Entradas.Configuracion[m][3]];
	}
	var Tfec, Tfec2, Tdia, Cdia, Cfila, texto, selDia, CdiaTmp, selected, etiqueta;
	var clases = new Array();
	clases[201] = clases[209] = clases[299] = 'class="laboral"';
	clases[202] = 'class="festivo"';
	clases[203] = clases[211] = 'class="vacaciones"';
	clases[204] = clases[205] = clases[206] = clases[207] = clases[208] = 'class="otros"';
	clases[210] = 'class="ano_anterior"';
	//
	var tmp = '<table class="tabla_anio" border="1">';
	tmp += '<tr><th>DIA</th><th title="1º horario">H1</th><th title="2ºhorario">H2</th><th title="3º horario">H3</th>';
	tmp += (Config[301][2] == 4) ? '<th title="4º horario">H4</th>' : '';
	tmp += '<th title="Tipo de Día">Tipo de días</th><th>NOTAS</th><th title="Horas normales">HN</th><th title="Horas especiales">HE</th></tr>';
	// BUCLE DIAS MES ....
	for (var i = 1; i <= actual.diasMes; i++) {
		// DIAS DEL MES FINES DE SEMANA, FESTIVOS Y OTROS
		Tfec = new Date(actual.fecha[0], actual.fecha[1], i, 0, 0, 0, 0);
		mensual.hoy_lab = true;
		mensual.hoy_HN = mensual.hoy_HE = 0;
		// TIPO DE DIAS
		selDia = '<select onchange="editaDia(this);" style="min-width:100%">';
		for (var m in Config) {
			etiqueta = '';
			if (DATOS.Entradas.Dias) {
				for (var n in DATOS.Entradas.Dias) {
					CdiaTmp = 'class="laboral"';
					if (Tfec.getTime() == DATOS.Entradas.Dias[n][0] * 1000) {
						var TmpDia = DATOS.Entradas.Dias[n][1];
						if (TmpDia == m) {
							selected = ' selected ';
							if (m > 201 && m < 300 && m != 209 && m != 210) {
								mensual.dias_no_lab++;
								mensual.hoy_lab = false;
							} else {
								mensual.hoy_lab = true;
							}
						} else {
							selected = '';
						}
						CdiaTmp = clases[TmpDia];
						etiqueta = '<span class="etiqueta">' + Config[TmpDia][0] + '</span>';
						break;
					}
				}
			} else {
				break;
			}
			if (m > 200 && m < 300) { selDia += '<option value="' + m + '"' + selected + 'title="' + Config[m][0] + '">' + Config[m][0] + '</option>'; }
			selected = '';
		}
		selDia += '</select>' + etiqueta;
		//
		if (Tfec.getDay() == 0) {
			Cdia = Cfila = 'class="domingo"';
			mensual.dias_no_lab++;
			mensual.hoy_lab = false;
		} else if (Tfec.getDay() == 6) {
			Cdia = Cfila = 'class="sabado"';
			if (Config[105][2] < 6) {
				mensual.dias_no_lab++;
				mensual.hoy_lab = false;
			}
		} else {
			Cdia = Cfila = CdiaTmp;
		}
		//HOY
		var Hoy = ((Tfec.getFullYear() == DH.getFullYear()) && (Tfec.getMonth() == DH.getMonth()) && (Tfec.getDate() == DH.getDate()));
		var estHoy = (Hoy) ? ' style="border-left:8px solid #393;" ' : '';
		tmp += '<tr ' + Cfila + ' id="' + i + '"' + estHoy + '><td ' + Cdia + ' style="font-weight:bolder;">' + ((i < 10) ? '&nbsp;' + i : i) + ' ';
		tmp += '<span style="font-size:9px;">' + DSEMANA[Tfec.getDay()] + '</span></td>';
		var entrada = true;
		var AH = new Array();
		for (var j = 0; j < DATOS.Entradas.Marcas.length; j++) {
			Tfec2 = new Date(DATOS.Entradas.Marcas[j][0] * 1000);
			Tdia = Tfec2.getDate();
			if (Tdia == i) {
				if (entrada == true) {
					if (DATOS.Entradas.Marcas[j][1] == 0) {
						AH.push(DATOS.Entradas.Marcas[j][0] * 1000);
					} else {
						AH.push(0);
						j--;
					}
					entrada = false;
				} else {
					if (DATOS.Entradas.Marcas[j][1] == 1) {
						AH.push(DATOS.Entradas.Marcas[j][0] * 1000);
					} else {
						AH.push(0);
						j--;
					}
					entrada = true;
				}
			}
		}
		// MARCAS
		for (var k = 0; k < (Config[301][2] * 2); k += 2) {
			AH.push(0, 0);
			tmp += '<td  style="padding:1px;">' + horario(AH[k], AH[k + 1]) + '</td>';
		}
		// NOTAS
		texto = '';
		if (DATOS.Entradas.Notas) {
			var tn = -1;
			for (var n in DATOS.Entradas.Notas) {
				texto = '';
				tn = -1;
				if (Tfec.getTime() == DATOS.Entradas.Notas[n][0] * 1000) {
					//texto =  Base64.decode(DATOS.Entradas.Notas[n][1]);
					texto = DATOS.Entradas.Notas[n][1];
					tn = n;
					break;
				}
			}
		} else {
			var tn = -1;
		}
		tmp += '<td  ' + Cfila + '>' + selDia + '</td>';
		/*tmp += '<td><textarea onchange="editaNotaDia(this,\'Notas\');" onfocus="this.style.height=\'100px\'"';
		tmp += ' onblur="this.style.height=\'16px\'" style="width:400px;text-align:left;">';
		tmp += texto+'</textarea></td>';*/
		tmp += '<td class="nota" contenteditable="true" onblur="deselec_nota(this,' + tn + ')"';
		tmp += ' onfocus="selec_nota(this)">';
		tmp += texto + '</td>';
		tmp += '<td>' + formatoHM(mensual.hoy_HN) + '</td>';
		tmp += '<td>' + formatoHM((mensual.hoy_HE * Config[104][2]) - mensual.hoy_HE) + '</td></tr>';
		mensual.hoy_HE = (mensual.hoy_HE * Config[104][2]) - mensual.hoy_HE;
		mensual.horas_trab += (mensual.hoy_HN + mensual.hoy_HE);
	}
	// RESUMEN
	datos_anuales_teoricos();
	mensual.dias_lab = actual.diasMes - mensual.dias_no_lab;
	mensual.horas_teoricas = Math.round(mensual.dias_lab * anual.horas_dia);
	mensual.horas_complementarias = mensual.horas_trab - mensual.horas_teoricas;
	//
	actual.idMes = new Date(actual.fecha[0], actual.fecha[1], 1, 0, 0, 0, 0).getTime() / 1000;
	contenido('/editor?accion=6&grupo=' + actual.grupo + '&id=' + actual.idMes + '&v1=' + mensual.dias_lab + '&v2=' + mensual.horas_trab);
	//
	tmp += '<tr id="total_mes"><td colspan="' + ((Config[301][2] == 4) ? 7 : 6) + '" style="padding: 10px;" ><span>DIAS LABORABLES <b> ' + mensual.dias_lab + '</b></span>';
	tmp += '<span>HORAS DIA TEORICAS <b> ' + formatomHMS(anual.horas_dia) + '</b></span>';
	tmp += '<span>HORAS MES TEORICAS <b> ' + formatomHM(mensual.horas_teoricas) + '</b></span>';
	tmp += '<span>HORAS COMPLEMENTARIAS <b> ' + formatomHM(mensual.horas_complementarias) + '</b></span></td>';
	tmp += '<td colspan="2" style="text-align:center;vertical-align:middle;"><b>' + formatomHM(mensual.horas_trab) + '</b></tr>';
	tmp += '</table>';
	tmp += '<div class="nota">* Para los teóricos se descuentan todos los dias de fiesta, vacaciones, vacaciones año anterior y todas las ausencias justificadas como:';
	tmp += 'Asuntos propios, bajas, licencias.<br>&nbsp;&nbsp;Las horas  del año anterior tienen un horario H1 ficticio para poder ser descontadas de manera precisa segun los varemos del año anterior</div>';
	document.getElementById('salida').innerHTML = tmp;
	//
	if (actual.id > 0) {
		cargando(0);
		var enfocado = document.getElementById(String(actual.id));
		if (enfocado.nextSibling != null) {
			enfocado.nextSibling.childNodes[0].focus();
		} else {
			var sig = enfocado.parentNode.parentNode.parentNode.parentNode.nextSibling;
			sig.childNodes[0].focus();
			sig.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].focus();
		}
	}
	cargando(0)
	//informe.htm
	if (informe_estilo) { informe_estilo() }
}
const deselec_nota = (ob, n) => {
	ob.style.whiteSpace = 'nowrap';
	if (n == -1 && ob.innerHTML != '') {
		editaNota(ob);
		return false;
	}
	if (DATOS.Entradas.Notas[n]) {
		if (ob.innerHTML !== Base64.decode(DATOS.Entradas.Notas[n][1])) {
			editaNota(ob);
		}
	}
}
const selec_nota = ob => {
	ob.style.whiteSpace = 'normal';
}
//////////////////////////////////
const ano = datos => {
	DATOS.Ano = datos
	var times, estilo, navegador, tmp, ahora, inimes, HL, HT, D, A, THL, THT, TD, TA, RES, l;
	ahora = new Date();
	inimes = new Array(); HL = new Array(); HT = new Array(); D = new Array(); A = new Array();
	THL = THT = TD = TA = l = 0;
	var filas = ['Teóricas', 'Trabajadas', 'Diferencia', 'Acumulado'];
	navegador = '<div id="navegador"><span onclick="inicia();">Inicio  &raquo;</span>';
	navegador += '<span onclick="cargaGrupo(' + DATOS.Grupo[actual.grupo][0] + ',0,mes);">Marcajes ' + DATOS.Grupo[actual.grupo][1] + '  &raquo;</span>';
	navegador += '<span class="activo">Resumen Anual</span></div>';
	document.getElementById('control').innerHTML = navegador;
	tmp = '<table class="anual" border="1"><caption>Horas trabajadas ' + actual.fecha[0] + '</caption><tr style="border:2px solid #999;background-color:#999;"><th>Tipo horas</th>';
	for (var i in MES) {
		times = new Date(actual.fecha[0], i, 1, 0, 0, 0, 0);
		inimes[i] = times.getTime() / 1000;
		for (var j in DATOS.Ano.Meses) {
			HL[i] = HT[i] = D[i] = A[i] = 0;
			if (DATOS.Ano.Meses[j][0] == inimes[i]) {
				HL[i] = Math.floor(DATOS.Ano.Meses[j][1] * anual.horas_dia);
				HT[i] = DATOS.Ano.Meses[j][2];
				D[i] = HT[i] - HL[i];
				THL += HL[i]; THT += HT[i]; TD += D[i];
				A[i] = TA = TD;
				break;
			}
		}
		//TOTALES
		HL[12] = THL; HT[12] = THT; D[12] = TD; A[12] = TA;
		estilo = (inimes[i] > ahora.getTime() / 1000) ? ' style="color:#bbb;font-size:10px;" ' : ' style="font-size:10px;" ';
		tmp += '<th' + estilo + '>' + MES[i] + '</th>';
	}
	tmp += '<th>TOTALES</th></tr>';
	RES = [HL, HT, D, A];
	console.log(RES);
	for (var i in filas) {
		tmp += '<tr style="text-align:right;"><td>' + filas[i] + '</td>';
		for (var j = 1; j < 14; j++) {
			estilo = (inimes[i] > ahora.getTime() / 1000 && j < 13) ? ' style="color:#ccc;" ' : '';
			tmp += '<td' + estilo + '>' + formatomHM(RES[i][j - 1]) + '</td>';
		}
		tmp += '</tr>';
	}
	RES = new Array();
	for (var i in Config) {
		l = 1;
		for (var j in DATOS.Ano.Dias) {
			if (i == DATOS.Ano.Dias[j][1]) {
				RES[i] = [Config[i][0], Config[i][2], l]; l++;
			}
		}
	}
	tmp += '</table><table class="anual" border="1"><caption>Dias no trabajados ' + actual.fecha[0] + '</caption>';
	tmp += '<tr style="border:2px solid #999;background-color:#999;"><th style="widht:80%">Justificación</th><th style="width:10%">Teórico</th><th style="width:10%">Nº de días</th></tr>';
	for (var i in RES) {
		tmp += '<tr><td>' + RES[i][0] + '</td><td>' + ((RES[i][1] > 0) ? RES[i][1] : '') + '</td><td style="text-align:right;">' + RES[i][2] + '</td></tr>';
	}
	tmp += '<table>';
	document.getElementById('salida').innerHTML = tmp;
	document.title = actual.fecha[0] + ' Resumen anual ' + DATOS.Grupo[actual.grupo][1];
	cargando(0);
}
// CONFIGURACION ////////////////////////////////
const configuracion = datos => {
	DATOS.Normas = datos
	console.log(DATOS)
	var navegador = '<div id="navegador"><span onclick="inicia();">Inicio &raquo;</span><span class="activo">Configuración ' + DATOS.Grupo[actual.grupo][1] + '</span></div>';
	document.getElementById('control').innerHTML = navegador;
	var tmp = '<table id="normas"><caption>Editor de Normas</caption><tr><td></td><td></td></tr>';
	for (var i in DATOS.Normas) {
		var tipo = DATOS.Normas[i][2].split(',');
		switch (tipo[0]) {
			case 'time':
				tmp += '<tr><td>' + DATOS.Normas[i][1] + '</td>';
				tmp += '<td style="text-align:right"><input id ="' + DATOS.Normas[i][0] + '"type="time" value="' + (DATOS.Normas[i][3]) + '" name="' + (DATOS.Normas[i][3]) + '" ';
				tmp += 'onchange="this.style.borderColor=\'#f00\';" />';
				tmp += '<button onclick="edita_norma(this.previousSibling,\'' + tipo[1] + '\',\'' + tipo[2] + '\');" title="Actualizar"></button></td></tr>';
				break;
			case 'number':
				tmp += '<tr><td>' + DATOS.Normas[i][1] + '</td>';
				tmp += '<td style="text-align:right"><input id ="' + DATOS.Normas[i][0] + '"type="number" value="' + DATOS.Normas[i][3] + '" name="' + (DATOS.Normas[i][3]) + '" ';
				tmp += 'onchange="this.style.borderColor=\'#f00\';" />';
				tmp += '<button onclick="edita_norma(this.previousSibling,' + tipo[1] + ',' + tipo[2] + ');" title="Actualizar"></button></td></tr>';
				break;
		}
	}
	tmp += '<tr><td></td><td></td></tr></table>';
	document.getElementById('salida').innerHTML = tmp;
	var tmp = new Date(actual.fecha[0], 1, 0, 0, 0, 0, 0);
	document.title = 'Configuracion ' + DATOS.Grupo[actual.grupo][1] + ' de ' + tmp.getFullYear();
	cargando(0);
}
//////////////////////////////////////////////////////////////////////////////////////////////////
const editado = datos => {
	console.log(this, datos)
	cargando(0)
	if (datos.error) alert('Error 405')
	cargaGrupo(actual.grupo, 0, mes)

}
const editadoNorma = datos => {
	cargando(0)
	if (datos.error) alert('Error 411')
	cargaGrupo(actual.grupo, 4, configuracion)
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function editaMarca(Obj, tipo) {
	cargando(1);
	var id = Number(Obj.parentNode.id);
	var dia = Number(Obj.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.id);
	if (Obj.value.indexOf(':') > 0) {
		var HM = Obj.value.split(':');
	} else if (Obj.value.indexOf('.') > 0) {
		var HM = Obj.value.split('.');
	} else {
		var HM = Obj.value.split(' ');
	}
	var hora = Number(HM[0]);
	var minuto = (HM.length > 1) ? Number(HM[1]) : 0;
	if (String(hora) == 'NaN' || String(minuto) == 'NaN') {
		alert('Solo valores númericos');
		Obj.value = ''; Obj.focus(); cargando(0);
		return false;
	} else if ((hora < 0 || hora > 24) || (minuto < 0 || minuto > 59)) {
		alert('Horario erroneo');
		Obj.value = ''; Obj.focus(); cargando(0);
		return false;
	} else if (hora == 24) {
		hora = 23; minuto = 59;
	}
	var valor = new Date(actual.fecha[0], actual.fecha[1], dia, hora, minuto, 0, 0).getTime();
	actual.id = valor;
	for (var j = 0; j < DATOS.Entradas.Marcas.length; j++) {
		if (DATOS.Entradas.Marcas[j][0] == valor / 1000) {
			alert('Horario repetido');
			Obj.value = ''; Obj.focus(); cargando(0);
			return false;
		}
	}
	contenido('/editor?accion=1&grupo=' + actual.grupo + '&id=' + (id / 1000) + '&tabla=Entradas&valor=' + (valor / 1000) + '&tipo=' + tipo, editado);
}
function editaNota(Obj) {
	cargando(1);
	var valor = Obj.innerHTML;
	valor = valor.replace(/&nbsp;/g, '');
	actual.id = Number(Obj.parentNode.id);
	var id = new Date(actual.fecha[0], actual.fecha[1], (actual.id), 0, 0, 0, 0).getTime();
	console.log('/editor?accion=1&grupo=' + actual.grupo + '&id=' + (id / 1000) + '&tabla=Notas&valor=' + valor);
	contenido('/editor?accion=1&grupo=' + actual.grupo + '&id=' + (id / 1000) + '&tabla=Notas&valor=' + valor, editado);
}
function editaDia(Obj) {
	cargando(1);
	var valor = Obj.value;
	actual.id = Number(Obj.parentNode.parentNode.id);
	var id = new Date(actual.fecha[0], actual.fecha[1], (actual.id), 0, 0, 0, 0).getTime();
	contenido('/editor?accion=1&grupo=' + actual.grupo + '&id=' + (id / 1000) + '&tabla=Dias&valor=' + valor, editado);
}
function edita_norma(Obj, min, max) {
	cargando(1);
	var valor = Obj.value;
	if (valor < min || valor > max) {
		alert('Valor no válido.\nValores aceptados entre ' + min + ' y ' + max);
		Obj.value = Obj.name;
		cargando(0);
		return false;
	}
	var id = Number(Obj.id);
	contenido('/editor?accion=5&grupo=' + actual.grupo + '&id=' + id + '&valor=' + valor, editadoNorma);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const cargaGrupo = (n, accion, funcion) => {
	var rango = '';
	if (accion == 0) {
		rango = '&' + rango_mes();
	} else if (accion == 3) {
		rango = '&' + rango_ano();
	}
	actual.grupo = n;
	const accesos = JSON.parse(localStorage.getItem('horarios-web-2024'));
	if (accesos ||window.location.pathname === '/informe.htm' ) {
		cargando(1);
		contenido('/editor?accion=' + accion + '&grupo=' + actual.grupo + rango, funcion);
	} else {
		document.getElementById('autentificacion').style.display = 'flex';
	}
}
const comprovar = ob => {
	const autentificacion = datos => {
		let entrada = datos
		if (entrada.autentico) {
			localStorage.setItem('horarios-web-2024', new Date().getTime())
			document.getElementById('autentificacion').style.display = 'none'
		} else {
			alert('¡ Login incorrecto !')
		}
	}
	let contrasena = ob.previousSibling.previousSibling.value
	let usuario = ob.previousSibling.previousSibling.previousSibling.previousSibling.previousSibling.value
	contenido('/autentificacion?usuario=' + usuario + '&contrasena=' + contrasena, autentificacion)
}
const elimina = ob => {
	if (ob.parentNode.id != 0) {
		var id = Number(ob.parentNode.id) / 1000;
		cargando(1);
		contenido('/editor?accion=2&grupo=' + actual.grupo + '&id=' + id, editado);
	}
}
function inicia() {
	document.getElementById('control').innerHTML = '<div id="navegador"><span class="activo">Inicio</span></div>';
	cargando(1);
	contenido('/editor', menu)
}
function cargando(n) {
	document.getElementById('cargando').style.display = (n == 0) ? 'none' : 'block';
}
function rango_mes() {
	var ini = new Date(actual.fecha[0], actual.fecha[1], 0, 23, 59, 59, 0).getTime() / 1000;
	var fin = new Date(actual.fecha[0], actual.fecha[1] + 1, 0, 23, 59, 59, 0).getTime() / 1000;
	return 'ini=' + ini + '&fin=' + fin;
}
function rango_ano() {
	var ahora = new Date();
	var ini = new Date(actual.fecha[0], 0, 0, 23, 59, 59, 0).getTime() / 1000;
	var fin = new Date(actual.fecha[0], 11, 31, 23, 59, 59, 0).getTime() / 1000;
	return 'ini=' + ini + '&fin=' + fin;
}
function formatoMarcaje(i) {
	var t = new Date(i);
	return t.getDate() + ' de ' + MES[t.getMonth()] + ' de ' + t.getFullYear() + ' a las ' + t.getHours() + ':' + t.getMinutes();
}
function formatomHM(hd) {
	var h = Math.floor(hd / 3600000);
	var m = Math.floor(60 * ((hd / 3600000) - h));
	if (hd < 0) {
		return '<span style="color:#900;">' + h + ':' + ((m < 10) ? '0' + m : m) + '</span>';
	} else {
		return '<span>' + h + ':' + ((m < 10) ? '0' + m : m) + '</span>';
	}
}
function formatomHMS(hd) {
	if (hd == 0) return '';
	hd /= 1000;
	var h = Math.floor(hd / 3600);
	var m = (Math.floor((hd % 3600) / 60) < 10) ? '0' + Math.floor((hd % 3600) / 60) : Math.floor((hd % 3600) / 60);
	var ms = (Math.floor((hd % 3600) % 60) < 10) ? '0' + Math.floor((hd % 3600) % 60) : Math.floor((hd % 3600) % 60);
	return '<span>' + h + ':' + m + ':' + ms + '</span>';
}
function formatoHM(hd) {
	if (hd == 0) return '';
	var t = new Date(hd);
	var h = (t.getHours() == 0) ? 23 : t.getHours() - 1;
	var m = t.getMinutes();
	return h + ':' + ((m < 10) ? '0' + m : m);
}
////////////////////////////////////////////////////////////////////////////////////////////////////
function horario(en, sa) {
	var Ten = new Date(en);
	var Tsa = new Date(sa);
	var Tini = new Date(en);
	var Tfin = new Date(sa);
	// HORARIOS EN VARIABLES
	if (en > 0 && sa > 0) {
		var hn_tmp = sa - en;
		var he_tmp = 0;
		mensual.hoy_HN += hn_tmp;
		if (mensual.hoy_lab) {
			var ini_tmp = Config[102][2].split(':');
			var fin_tmp = Config[103][2].split(':');
			var m = [Tini.setHours(Number(ini_tmp[0]), Number(ini_tmp[1]), 0, 0), Tfin.setHours(Number(fin_tmp[0]), Number(fin_tmp[1]), 0, 0)];
			if (en < m[0] && sa < m[1]) {
				if (sa > m[0]) { mensual.hoy_HE += m[0] - en; } else { mensual.hoy_HE += sa - en }
			} else if (en < m[1] && sa > m[1]) {
				if (en < m[0]) { mensual.hoy_HE += (m[0] - en) + (sa - m[1]); } else { mensual.hoy_HE += sa - m[1]; }
			} else if (en > m[1]) {
				mensual.hoy_HE += sa - en;
			}
		} else {
			he_tmp = hn_tmp;
			mensual.hoy_HE += he_tmp;
		}
	}/**/
	//REPRESENTACION
	var TenH = (en == 0) ? '' : Ten.getHours();
	var TenM = (en == 0) ? '' : Ten.getMinutes();
	var TsaH = (sa == 0) ? '' : Tsa.getHours();
	var TsaM = (sa == 0) ? '' : Tsa.getMinutes();
	var error = ((en == 0 && sa == 0) || (en != 0 && sa != 0)) ? false : true;
	var ielim = '<img onclick="elimina(this);"  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6M0YwMUI5MzRFMEFFMTFFMzhFMThGRDU5QzA1REJCOUEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6M0YwMUI5MzVFMEFFMTFFMzhFMThGRDU5QzA1REJCOUEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozRjAxQjkzMkUwQUUxMUUzOEUxOEZENTlDMDVEQkI5QSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDozRjAxQjkzM0UwQUUxMUUzOEUxOEZENTlDMDVEQkI5QSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqrWWyQAAAC4SURBVHjaYvz//z8DMYAFRCgoKDgBKUMgngDEf6FyzEBcAMTnHzx4sI8JKugFxD1AXItkSC1UzAtuItD6SUCKn5GRsR5I34cqrAeKzwHSk+AKgeAREKcC8QMgXgAVqwHiVhQ3Ak2C8Z8jWf0cSRxuIhcQFwFxM9C6eqjmuUBKCoj7gPgbTCFIsgyI5wFxE1RMHqQRiHmBuBzmmXNQR9fDrAKKFQOpL0B8DmwDsQHOxEAkGAoKAQIMAOJkMxKPYEwSAAAAAElFTkSuQmCC" />';
	var ivacio = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OTRCREJFQkZFMEFDMTFFM0JDQjVCRkEzODVDMTYyNjUiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTRCREJFQzBFMEFDMTFFM0JDQjVCRkEzODVDMTYyNjUiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo5NEJEQkVCREUwQUMxMUUzQkNCNUJGQTM4NUMxNjI2NSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo5NEJEQkVCRUUwQUMxMUUzQkNCNUJGQTM4NUMxNjI2NSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Ph9wZmIAAAAbSURBVHjaYvz//z8DMYCJgUgwqnBUIQYACDAATqoDG3+43NsAAAAASUVORK5CYII=" />';
	var serror = 'style="outline:1px solid #f00;outline-offset:-1px;"';
	var eliminar = (en == 0) ? ivacio : ielim;
	var estilo = (error && (en == 0)) ? serror : '';
	function f(n) { return (n < 10) ? '0' + n : String(n); }
	var valorE = (en != 0) ? f(TenH) + ':' + f(TenM) : '';
	var valorS = (sa != 0) ? f(TsaH) + ':' + f(TsaM) : '';

	var s = '<table class="horario"><tr><td id="' + en + '">'
	s += '<input onchange="editaMarca(this,0);" onkeypress="borra_entrada(event,this);" type="text" ' + estilo + ' value="' + valorE + '" />';
	s += eliminar + '</td>';
	eliminar = (sa == 0) ? ivacio : ielim;
	estilo = (error && (sa == 0)) ? serror : '';
	s += '<td id="' + sa + '">'
	s += '<input onchange="editaMarca(this,1);" onkeypress="borra_entrada(event,this);" type="text" ' + estilo + ' value="' + valorS + '" />';
	s += eliminar + '</td></tr></table>';
	return s;
}
const borra_entrada = (e, o) => {
	let x = e.which || e.keyCode;
	if (x == 32) {  // space
		o.value = ''
	}
}
//--------------------
window.onload = inicia;
//--------------------