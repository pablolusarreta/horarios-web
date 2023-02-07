<?php
	/*
	!accion		enviar datos generales					
	
	case 0: 	mostrar informacion 	accion=0, grupo, ini, fin
	case 1: 	añadir/modificar		accion=1, grupo, id, tabla
	case 2: 	eliminar				accion=1, grupo, id
	
	
    
	if(!$app){
		if($_COOKIE["sustapena_nivel"]>2){
			die('{Error:"Usuario sin privilegios suficientes\nIniciar sesion en http://sarobe.info/sustapena con otro usuario"}');
		}else if(isset($_COOKIE["sustapena_id"])){
			$IDUsuario = $_COOKIE["sustapena_id"];
		}else{
			die('{Error:"Usuario sin grupo de horarios\nIniciar sesion en http://sarobe.info/sustapena con otro usuario"}');
		}
	}*/
	
	$IDUsuario = "plusarreta";
	$dbd	= sqlite_open("../../db/horarios.sqlite");
	if (isset($_REQUEST['accion'])){
		switch($_REQUEST['accion']){
			case 0:
				$condicion  = " WHERE Grupo=".$_REQUEST['grupo']." AND ID>".$_REQUEST['ini']." AND ID<".$_REQUEST['fin']." ORDER BY ID ASC";
				$Mconfig=$Mentradas=$Mnotas=$Mdias=array();
				//NORMAS
				$sql 		= "SELECT * FROM Configuracion WHERE Grupo=".$_REQUEST['grupo']." ORDER BY ID ASC";
				$res 		= sqlite_query($dbd,$sql);
				while (sqlite_has_more($res)){
					$Mconfig[] = '['.sqlite_column($res, 0).',"'.sqlite_column($res, 1).'","'.sqlite_column($res, 2).'","'.sqlite_column($res, 3).'"]';
					sqlite_next($res);
				}
				$salida[] = 'Configuracion:['.join($Mconfig,',').']';
				//ENTRADAS
				$sql 		= "SELECT ID,Tipo FROM Entradas".$condicion;
				$res 		= sqlite_query($dbd,$sql);
				while (sqlite_has_more($res)){
					$Mentradas[] = '['.sqlite_column($res, 0).','.sqlite_column($res, 1).']';
					sqlite_next($res);
				}
				$salida[] = 'Marcas:['.join($Mentradas,',').']';
				//NOTAS
				$sql 	= "SELECT ID,Texto FROM Notas".$condicion;
				$res 	= sqlite_query($dbd,$sql);
				while (sqlite_has_more($res)){
					$Mnotas[]= '['.sqlite_column($res, 0).',"'.base64_encode(sqlite_column($res, 1)).'"]';
					sqlite_next($res);
				}
				$salida[] = 'Notas:['.join($Mnotas,',').']';
				//DIAS
				$sql 	= "SELECT ID,IDD FROM Dias".$condicion;
				$res 	= sqlite_query($dbd,$sql);
				while (sqlite_has_more($res)){
					$Mdias[] = '['.sqlite_column($res, 0).','.sqlite_column($res, 1).']';
					sqlite_next($res);
				}
				$salida[] = 'Dias:['.join($Mdias,',').']';
				// ANUAL TEORICO
				$ano	= date('Y',$_REQUEST['fin']);
				$tini 	= mktime(0,0,0,1,1,$ano);
				$tfin 	= mktime(0,0,0,1,1,$ano+1);
				$sql 	= "SELECT ID FROM Dias WHERE Grupo=".$_REQUEST['grupo']." AND ID>".$tini." AND ID<".$tfin." AND IDD>203 AND IDD<300 AND IDD!=209 AND IDD!=210";
				$res 	= sqlite_query($dbd,$sql);
				$salida[] = 'DNTano:'.sqlite_num_rows($res);
				//
				echo '{'.join($salida,',').'}';
				sqlite_close($dbd);
				break;
			case 1:
				$id 	= $_REQUEST['id'];
				$tabla 	= $_REQUEST['tabla'];
				switch($tabla){
					case 'Entradas':
						$sql 	= "DELETE FROM Entradas WHERE Grupo=".$_REQUEST['grupo']." AND ID=".$_REQUEST['id'];
						sqlite_exec($dbd,$sql);
						$sql = "INSERT INTO Entradas VALUES(".$_REQUEST['valor'].", ".$_REQUEST['tipo'].", ".$_REQUEST['grupo'].")";
						break;
					case 'Notas':
						$sql = "DELETE FROM Notas WHERE Grupo=".$_REQUEST['grupo']." AND ID=".$_REQUEST['id'];
						sqlite_exec($dbd,$sql);
						if( trim($_REQUEST['valor']) != '') {
							$sql = "INSERT INTO Notas VALUES(".$id.", '".$_REQUEST['valor']."',".$_REQUEST['grupo'].")";
						}
						break;
					case 'Dias':
						$sql = "DELETE FROM Dias WHERE Grupo=".$_REQUEST['grupo']." AND ID=".$_REQUEST['id'];
						sqlite_exec($dbd,$sql);
						if( $_REQUEST['valor'] > 201) {
							$sql = "INSERT INTO Dias VALUES(".$id.", '".$_REQUEST['valor']."',".$_REQUEST['grupo'].")";
						}
						break;
				}
				if($app){echo('{id:'.$_REQUEST['valor'].',tipo:'.$_REQUEST['tipo'].'}');}
				if(!sqlite_exec($dbd,$sql)){
					if(!$app){echo('ERROR no se modifico el marcaje con ID = "'.$id.'"');}else{echo('{id=0}');}
				}
				sqlite_close($dbd);
				break;
			case 2:
				$sql 	= "DELETE FROM Entradas WHERE Grupo=".$_REQUEST['grupo']." AND ID=".$_REQUEST['id'];
				if(!sqlite_exec($dbd,$sql)){
					echo('ERROR no se eliminó el marcaje con ID = "'.$_REQUEST['id'].'"');
				}
				sqlite_close($dbd);
				break;
			case 3:
				$condicion  = " WHERE Grupo=".$_REQUEST['grupo']." AND ID>=".$_REQUEST['ini']." AND ID<".$_REQUEST['fin']." ORDER BY ID ASC";
				$Mmeses=$Mdias=array();
				$sql 		= "SELECT ID,DiasLaborables,HorasTrabajadas FROM Meses".$condicion;
				$res 		= sqlite_query($dbd,$sql);
				while (sqlite_has_more($res)){
					$Mmeses[] = '['.sqlite_column($res, 0).','.sqlite_column($res, 1).','.sqlite_column($res, 2).']';
					sqlite_next($res);
				}
				$salida[] = 'Meses:['.join($Mmeses,',').']';
								$sql 	= "SELECT ID,IDD FROM Dias".$condicion;
				$res 	= sqlite_query($dbd,$sql);
				while (sqlite_has_more($res)){
					$Mdias[] = '['.sqlite_column($res, 0).','.sqlite_column($res, 1).']';
					sqlite_next($res);
				}
				$salida[] = 'Dias:['.join($Mdias,',').']';
				echo '{'.join($salida,',').'}';
				sqlite_close($dbd);
				break;
			case 4:
				$Mconfig=array();
				//NORMAS
				$sql 		= "SELECT * FROM Configuracion WHERE Grupo=".$_REQUEST['grupo']." ORDER BY ID ASC";
				$res 		= sqlite_query($dbd,$sql);
				while (sqlite_has_more($res)){
					$Mconfig[] = '['.sqlite_column($res, 0).',"'.sqlite_column($res, 1).'","'.sqlite_column($res, 2).'","'.sqlite_column($res, 3).'"]';
					sqlite_next($res);
				}
				echo '['.join($Mconfig,',').']';
				sqlite_close($dbd);
				break;
			case 5:
				$sql 		= "UPDATE Configuracion SET Valor2='".$_REQUEST['valor']."' WHERE Grupo=".$_REQUEST['grupo']." AND ID=".$_REQUEST['id'];
				$res 		= sqlite_query($dbd,$sql);
				if(!sqlite_exec($dbd,$sql)){
					echo('ERROR no se modifico la norma con ID = "'.$id.'"');
				}
				sqlite_close($dbd);
				break;
			case 6:
				$sql = "DELETE FROM Meses WHERE Grupo=".$_REQUEST['grupo']." AND ID=".$_REQUEST['id'];
				sqlite_exec($dbd,$sql);
				$sql = "INSERT INTO Meses VALUES(".$_REQUEST['id'].",".$_REQUEST['v1'].",".$_REQUEST['v2'].",".$_REQUEST['grupo'].")";
				sqlite_exec($dbd,$sql);
				sqlite_close($dbd);
				break;
		}
	}else{
            $sql 	= "SELECT ID,Nombre,imagenB64MIME,imagenB64DATA FROM Grupo WHERE IDUsuario='".$IDUsuario."' ORDER BY ID ASC";
            $res 	= sqlite_query($dbd,$sql);
            while (sqlite_has_more($res)){
                $Mgrupo[] = '['.sqlite_column($res, 0).',"'.sqlite_column($res, 1).'","'.sqlite_column($res, 2).'","'.sqlite_column($res, 3).'"]';
                sqlite_next($res);
            }
            $sql 	= "SELECT ID,Nombre FROM Tipo ORDER BY ID ASC";
            $res 	= sqlite_query($dbd,$sql);
            while (sqlite_has_more($res)){
                $Mtipo[] = '['.sqlite_column($res, 0).',"'.sqlite_column($res, 1).'"]';
                sqlite_next($res);
            }
            sqlite_close($dbd);
            die('{Grupo:['.join($Mgrupo,',').'],Tipo:['.join($Mtipo,',').']}');   
	}
?>