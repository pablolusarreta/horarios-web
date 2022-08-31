<?php
ini_set('display_errors', '1');
ini_set('default_charset','iso-8859-1');
date_default_timezone_set('Europe/Madrid');
$DATOS = array();
function adjudica($tmp){
    $hmseg = 3600000;
    if($tmp < 3*$hmseg){
        $GLOBALS['H3']++;
    }
    if( $tmp >= 3*$hmseg AND $tmp < 5*$hmseg ){
        $GLOBALS['H5']++;
    }
    if( $tmp >= 5*$hmseg AND $tmp < 8*$hmseg ){
        $GLOBALS['H8']++;
    }
    if( $tmp >= 8*$hmseg AND $tmp < 12*$hmseg ){
        $GLOBALS['H12']++;
    }
    if( $tmp >= 12*$hmseg ){
        $GLOBALS['HM']++;
    }
}
$acu = array(0);
$tmpa = array(0);
function mismoDia (){
    $i = count($GLOBALS['acu']);
    $GLOBALS['acu'];

}
//fichaje.sqlite y horarios.sqlite

for($a=2008;$a<(date("Y")+1);$a++){
    $ini 		= mktime(0, 0, 0, 1, 1, $a);
    $fin		= mktime(0, 0, 0, 1, 1, ($a+1));
    $H3         = 0;
    $H5         = 0;
    $H8         = 0;
    $H12        = 0;
    $HM         = 0;
    if($a<2014){
        $dbd		= sqlite_open("../../db/fichaje.sqlite");
        $sql 		= "SELECT HE1,HS1,HE2,HS2 FROM Horarios WHERE ( HE1>".$ini." AND HS1<".$fin." ) OR ( HE2>".$ini." AND HS2<".$fin.") ORDER BY HE1,HE2 ASC";
        $res 		= sqlite_query($dbd,$sql);
        while (sqlite_has_more($res)){
            $tmp = (sqlite_column($res, 1) - sqlite_column($res, 0))*1000;
            //adjudica($tmp);
            $tmp += (sqlite_column($res, 3) - sqlite_column($res, 2))*1000;
            adjudica($tmp);
            sqlite_next($res);
        }
        $DATOS[] = '['.$a.','.$H3.','.$H5.','.$H8.','.$H12.','.$HM.']';
    }else{
       $dbd		= sqlite_open("../../db/horarios.sqlite");
        $sql 		= "SELECT ID,Tipo FROM Entradas WHERE  Grupo=0 AND ( ID>".$ini." AND ID<".$fin." )  ORDER BY ID ASC";
        $res 		= sqlite_query($dbd,$sql);
       // echo ('---------------------------------- <br>');
        while (sqlite_has_more($res)){         
            if(sqlite_column($res, 1) == 0 ){        
                $te     =   sqlite_column($res,0);
                $acu[]  =  $te;                 
            }else{
                $i = count($acu);
                $tmpa [] = (sqlite_column($res,0)-$te)*1000;
                if(  date('z',$te) == date('z',$acu[$i-2]) ){
                    $i = count($tmpa);
                    $tmp = ($tmpa[$i-1]) + ($tmpa[$i-2]);
                    //echo( $te .' = '.$tmpa[$i-1].' + '.$tmpa[$i-2].'<br>');   
                }else{
                    $tmp = $tmpa[$i-1];
                    //echo( $tmp.'<br>') ;         
                } 
                adjudica($tmp);               
            }  
            sqlite_next($res);
        }
        $DATOS[] = '['.$a.','.$H3.','.$H5.','.$H8.','.$H12.','.$HM.']';
    }    
}
echo '['.join(',', $DATOS).']';
?>