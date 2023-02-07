<!DOCTYPE html>
<html lang="es">
<head>
<title>Fines de semana trabajados desde 2008</title>
<style>
body{
	font-family:"Segoe UI", "Lucida Sans Unicode", Georgia, Tahoma, Geneva, Arial, Helvetica, sans-serif;
	color:#000;
	margin:0;
	padding:0;
	background-color: #fff;
	font-size: 13px;
	cursor:default;
}
table {
	display: inline-block;
	border-collapse: collapse;
	margin: 10px;
	border: 2px solid #999;
	
}
td,th {
	padding: 6px 12px;
	text-align: left;

}
td:nth-child(2),th:nth-child(2){
	text-align: right;

}
div {
	margin: 10px;
	font-size: 18px;
}
span {
	font-size: 11px;
}
</style>
<body>
<?php
ini_set('display_errors', '1');
ini_set('default_charset','iso-8859-1');
date_default_timezone_set('Europe/Madrid');
echo '<div>Fines de semana y festivos trabajados desde 2008 <span>[ '.substr(date('c'),0,10).' ] &nbsp;&nbsp;&nbsp;&nbsp;*Poner "?h" para actual inacabado</span></div>';
//fichaje.sqlite
$dbd		= sqlite_open("../../db/fichaje.sqlite");
$sql 		= "SELECT HE1,HE2,Tipo FROM Horarios ORDER BY ID,HE1,HE2 ASC";
$res 		= sqlite_query($dbd,$sql);
$entradaF	= array();
while (sqlite_has_more($res)){
		// SABADOS Y DOMINGOS
		if((sqlite_column($res, 0)>0) AND  ((date("w",sqlite_column($res, 0))==6) OR (date("w",sqlite_column($res, 0))==0))){
			$entrada1[] =  sqlite_column($res, 0);
		}else if((sqlite_column($res, 1)>0) AND  ((date("w",sqlite_column($res, 1))==6) OR (date("w",sqlite_column($res, 1))==0))){
			$entrada1[] =  sqlite_column($res, 1);
		}
		//FESTIVOS
		if(sqlite_column($res, 2)==2){
			if(sqlite_column($res, 0)>0 OR sqlite_column($res, 1)>0){
				$entradaF[] = sqlite_column($res, 0);
			}
		}
		sqlite_next($res);
}
//horarios.sqlite
$dbd		= sqlite_open("../../db/horarios.sqlite");
$sql 		= "SELECT ID FROM Entradas WHERE Tipo=0 AND Grupo=0 ORDER BY ID ASC";
$res 		= sqlite_query($dbd,$sql);
while (sqlite_has_more($res)){
		if((sqlite_column($res, 0)>0) AND  ((date("w",sqlite_column($res, 0))==6) OR (date("w",sqlite_column($res, 0))==0))){
			$entrada2[] =  sqlite_column($res, 0);
		}else{
			$entrada[]=sqlite_column($res, 0);
		}
		sqlite_next($res);
}
function es_trabajado($festivo){
	foreach($GLOBALS["entrada"] as $V){
		if($V>$festivo && $V<($festivo+(60*60*24))){
			return true;
		}
	}
	return false;
}
//FESTIVOS
$sql 		= "SELECT ID FROM Dias WHERE IDD=202 AND Grupo=0 ORDER BY ID ASC";
$res 		= sqlite_query($dbd,$sql);
while (sqlite_has_more($res)){
		if(es_trabajado(sqlite_column($res, 0))){
			$entradaF[] =  sqlite_column($res, 0);
		}
		sqlite_next($res);
}
//CREACION DE LAS TABLAS
$S='';
$hasta = (isset($_REQUEST['h']))?(date("Y")+1):date("Y");
for($a=2008;$a<$hasta;$a++){
	$sabados		= 0;
	$domingos		= 0;
	$FSem			= 0;
	$Fest			= 0;
	$tmsAI 			= mktime(0, 0, 0, 1, 1, $a);
	$tmsAF 			= mktime(0, 0, 0, 1, 1, ($a+1));
	$S .= '<table border="1"><tr><td colspan="2" style="font-size:23px;text-align:right;">'.$a.'</td></tr>';
	$matriz = ($a<2014)?$entrada1:$entrada2;
	foreach($matriz as  $V){
		if($V>$tmsAI AND $V<$tmsAF){
			 if(date('w',$V)==6){
				 $sabados++;
				 $x = date('d',$V);
				 $FSem++;
			}else if(date('w',$V)==0){
				$domingos++;
				if(date('d',$V)!=($x+1)){$FSem++;}
			}
		}
	}
	foreach($entradaF as $V){
		if($V>$tmsAI AND $V<$tmsAF){
			$Fest++;
			
		}
	}
	$S .= '<tr><td>Sabados</td><td>'.$sabados.'</td></tr>';
	$S .= '<tr><td>Domingos</td><td>'.$domingos.'</td></tr>';
	$S .= '<tr><td>Festivos</td><td>'.$Fest.'</td></tr>';
	$S .= '<tr><td>TOTAL DIAS</td><th>'.($domingos+$sabados+$Fest).'</th></tr>';
	$S .= '<tr><td>Fines de semana</td><td>'.$FSem.'</td></tr></table>';

}
echo $S;
?>
</body>
</html>