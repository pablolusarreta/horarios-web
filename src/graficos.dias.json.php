<?php
ini_set('display_errors', '1');
ini_set('default_charset','iso-8859-1');
date_default_timezone_set('Europe/Madrid');
$DATOS = array();
function es_festivo($dia){
	foreach($GLOBALS["festivos"] as $V){
		if($dia>$V && $dia<($V+(60*60*24))){
			return true;
		}
	}
	return false;
}
//fichaje.sqlite

for($a=2008;$a<(date("Y")+1);$a++){
    $ini 		= mktime(0, 0, 0, 1, 1, $a);
    $fin		= mktime(0, 0, 0, 1, 1, ($a+1));
    $festivos   = array();
    $tmp        = 0;
    $sab        = 0;
    $dom        = 0;
    $fes        = 0;
    $Hsa        = 0;
    $Hdo        = 0;
    $Hfe        = 0;
    $HTA        = 0;
    if($a<2014){
        $dbd		= sqlite_open("../../db/fichaje.sqlite");
        $sql 		= "SELECT HE1,HE2,HT,Tipo,HC FROM Horarios WHERE ( HE1>".$ini." AND HS1<".$fin." ) OR ( HE2>".$ini." AND HS2<".$fin.") ORDER BY HE1,HE2 ASC";
        $res 		= sqlite_query($dbd,$sql);
        while (sqlite_has_more($res)){
            if(sqlite_column($res, 3)==2){
                $fes++;
                $Hfe += sqlite_column($res, 2);
            }else{
                if(date('w',sqlite_column($res, 0))==6 OR date('w',sqlite_column($res, 1))==6){
                    $sab++;
                    $Hsa += sqlite_column($res, 2);
                }else if(date('w',sqlite_column($res, 0))==0 OR date('w',sqlite_column($res, 1))==0){
                    $dom++;
                    $Hdo += sqlite_column($res, 2);
                }
            }
            $HTA += sqlite_column($res, 2)+sqlite_column($res, 4);
            sqlite_next($res);
        }
        $DATOS[] = '['.$a.','.$sab.','.$dom.','.$fes.','.$Hsa.','.$Hdo.','.$Hfe.','.$HTA.']';
    }else{
       $dbd		= sqlite_open("../../db/horarios.sqlite");
        $sql 		= "SELECT ID FROM Dias WHERE IDD=202 AND Grupo=0 AND ( ID>".$ini." AND ID<".$fin." ) ORDER BY ID ASC";
        $res 		= sqlite_query($dbd,$sql);
        while (sqlite_has_more($res)){    
            $festivos[] =  sqlite_column($res, 0);
            sqlite_next($res);
        }
        //BAJAS VACACIONES Y AÑO ANTERIOR LIcencia por ingreso, asuntos propios
        $sql 		= "SELECT ID FROM Dias WHERE ( IDD=205 OR IDD=211 OR IDD=208 OR IDD=204 ) AND Grupo=0 AND ( ID>".$ini." AND ID<".$fin." ) ORDER BY ID ASC";
        $res 		= sqlite_query($dbd,$sql);
        while (sqlite_has_more($res)){    
            $HTA += 5*3600;
            sqlite_next($res);
        }
        $sql 		= "SELECT ID,Tipo FROM Entradas WHERE  Grupo=0 AND ( ID>".$ini." AND ID<".$fin." ) ORDER BY ID ASC";
        $res 		= sqlite_query($dbd,$sql);
       while (sqlite_has_more($res)){
            if(sqlite_column($res, 1)==0){
                $tmp = sqlite_column($res, 0);
            }else{
                if(date("w",sqlite_column($res, 0))==6){
                    $sab++;
                    $Hsa += sqlite_column($res, 0)-$tmp;
                }else if(date("w",sqlite_column($res, 0))==0){
                    $dom++;
                    $Hdo += sqlite_column($res, 0)-$tmp;
                }else if(es_festivo(sqlite_column($res, 0))){
                    $fes++;
                    $Hfe += sqlite_column($res, 0)-$tmp;
                }else{
                    $HTA += sqlite_column($res, 0)-$tmp;
                }
        }          
           sqlite_next($res);
    }



        $HTA += (($Hsa*2)+($Hdo*2)+($Hfe*2));
        $DATOS[] = '['.$a.','.$sab.','.$dom.','.$fes.','.$Hsa.','.$Hdo.','.$Hfe.','.$HTA.']'; /* */
    }    
}
echo '['.join(',', $DATOS).']';
?>