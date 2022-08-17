<?php
ini_set('open_basedir', __DIR__);

function skip_comment($sheet) {
	while (($line = fgets($sheet)) !== FALSE) {
		$line = preg_replace('%.*\*/%', '', $line, 1, $replaced);
		if ($replaced) {
			if ($line) {
				echo $line;
			}
			return;
		}
	}
}

function print_skipping_comments($sheet, $line) {
	$line = preg_replace('%/\*\W*cut\b.*%', '', $line, 1, $replaced);
	if ($replaced) {
		if ($line) {
			echo $line;
		}
		skip_comment($sheet);
	} else {
		echo $line;
	}
}


$_REQUEST += [
	'css' => NULL,
	'style' => NULL,
	'sheets' => NULL,
];

$sheets = $_REQUEST['css'] ?? $_REQUEST['style'] ?? $_REQUEST['sheets'] ?? [];
if (! is_array($sheets)) {
	$sheets = explode(',', $sheets);
}
$sheets = array_map(
	fn ($sheet) => preg_replace('/(?:\.css)?$/', '.css', trim($sheet)),
	$sheets
);
if ($sheets) {
	$missing = array_filter(
		$sheets,
		fn ($sheet) => ! file_exists($sheet)
	);
} else {
	$sheets = glob('*.css');
	$missing = [];
}
if ($missing) {
    http_response_code(404);

	?><p>Missing files: <?= implode(', ', $missing) ?></p><?php
} else if (! $sheets) {
    http_response_code(404);

	?><p>No stylesheets specified.</p><?php
} else {
	header('Content-type: text/css; charset=UTF-8');
	?>
/*****
 * Inspired in part by:
 * + nWoD RELOADED!, by Jp12x
 * + Old World of Darkness Generic, by Monstah
 *	 + Changeling the Dreaming CS, by Takissis
 *****/

<?php
	foreach ($sheets as $sheet) {
		if (($file = fopen($sheet, 'r'))) {
			echo "/** {$sheet} */\n";
			while (($line = fgets($file)) !== FALSE) {
				print_skipping_comments($file, $line);
			}
			echo "\n";
			fclose($file);
		} else {
		}
	}
}
