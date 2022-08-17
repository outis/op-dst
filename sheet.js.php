<?php // -*- js-mode -*-
header('Content-type: text/javascript');

include_once('reqs.php');

$required = [
	'module'=>1, 'funcs'=>1, 'version'=>1, // core dependencies
];

// convert to a structure more readily used by `add_requirements`
foreach ($requires as $k => &$v) {
	$v = array_combine($v, $v);
}

function close_reqs($module, &$requires, &$visited=[]) {
	$reqs =& $requires[$module];
	if (empty($visited[$module])) {
		$visited[$module] = 1;
		foreach ($reqs as $req => $_) {
			$reqs = close_reqs($req, $requires, $visited) + $reqs;
		}
	}
	return $reqs;
}

// transitive closure for $requires
$visited = [];
foreach ($requires as $module => &$reqs) {
	$reqs = close_reqs($module, $requires, $visited);
	/*
	do {
		// potentially could be made more performant by using array_diff_key
		$nReqs = count($reqs);
		foreach ($reqs as $req => $_) {
			$reqs = $requires[$req] + $reqs;
		}
	} while ($nReqs < count($reqs));
	*/
}

function strip_comments($line) {
	return preg_replace('%//.*|/\*([^*]|\*(?!/))*\*/%', '', $line);
}

/**
 * `$line` is the start of a multiline comment
 */
function discard_comment($script, $line) {
	while (($line = fgets($script)) !== FALSE) {
		$parts = explode('*/', $line, 2);
		if (count($parts) > 1) {
			return strip_comments($parts[1]);
		}
	}
	return FALSE;
}

function print_nonblank($text) {
	if (! ctype_space($text)) {
		echo $text;
	}
}

function print_skipping_comments($script, $line) {
	$line = strip_comments($line);
	// TODO: fix false positives ('/*' in regexes, strings). For now, avoid triggering if possible.
	$parts = explode('/*', $line, 2);
	if (count($parts) > 1) {
		print_nonblank($parts[0]);
		$line = discard_comment($script, $parts[1]);
		return $line;
	} else {
		print_nonblank($line);
	}
}

//
function readscript($path) {
	/*
	readfile($path);
	return;
	*/

	if (($script = fopen($path, 'r'))) {
		while (($line = fgets($script)) !== FALSE) {
			do {
				$line = print_skipping_comments($script, $line);
			} while ($line);
		}
		fclose($script);
	}
}

// check user input for a list of modules to include
function get_modules() {
	$scripts = [];
	$modules = [];
	if (isset($_REQUEST['inc'])) {
		if (is_array($_REQUEST['inc'])) {
			return $_REQUEST['inc'];
		}
		$modules = $_REQUEST['inc'];
	} else {
		/* Scan input keys for a CSV of modules. If there isn't a CSV, check keys
		   w/ empty values to see if they're modules. */
		foreach ($_REQUEST as $key => $val) {
			$key = trim($key, " \t,");
			if ('' === $val) {
				if (strpos($key, ',', 1)) {
					$modules = $key;
					break;
				}
				if (file_exists("scripts/${key}.js")) {
					$scripts[] = $key;
				}
			}
		}
	}
	if (! $modules) {
		if ($scripts) {
			$modules = $scripts;
		} elseif (! $modules) {
			echo "// Couldn't determine which scripts to load, as none were specified, so loading all.\n";
			$modules = array_map(
				fn ($pathname) => preg_replace('%.*/|\.js$%', '', $pathname),
				glob('scripts/*.js')
			);
		}
		return $modules;
	}
	return preg_split('/\s*,\s*/', $modules);
}

/**
 * Extend the list of modules by adding any additional modules they require.
 */
function add_requirements(&$modules) {
	global $requires, $required;

	$incs = array_combine($modules, $modules);
	// dsf & pips are always required
	$incs += ['dsf'=>'dsf', 'pips'=>'pips'];
	// $requires is transitively closed, so no need to recurse
	foreach ($incs as $module => $_) {
		if (isset($requires[$module])) {
			$incs = $requires[$module] + $incs;
		}
	}
	// 
	$incs = array_diff_key($incs, $required);
	return $incs;
}

function include_modules($modules) {
	$modules = add_requirements($modules);
	$included = [];
	foreach ($modules as $module) {
		if (file_exists($file = "scripts/${module}.js")) {
			readscript($file);
			$included[$module] = $module;
		}
	}
	global $requires;
	echo "\n\tconst requires = ", json_encode($requires, JSON_PRETTY_PRINT), ";\n\n";
	echo "\n\tconst modules = ", json_encode($included), ";\n\n";
	//echo "\n\tconst included = ", json_encode($included), ";\n\n";
	return $included;
}
?>
(function ($) {
	var dbg = 1,
		$slug = $('.dst_slug'),
		slug = $slug.text(),
		globals = {},
		editMarker = 'Click to edit',
		containerId,
		pippedKinds = ['attributes', 'abilities', 'advantages', 'arcanoi'];



	<?php
	foreach ($required as $module => $_) {
		readscript("scripts/${module}.js");
	}

	$modules = get_modules();
	$included = include_modules($modules);
	?>
	for (let name in modules) {
		if (name in globals && 'object' == typeof(globals[name])) {
			modules[name] = globals[name];
			module.register(name, globals[name]);
			if ('updaters' in globals[name]) {
				version.registerModule(globals[name]);
			}
		}
	}

	/*** */
	const advantages = {
		arcanoi: fillObject([
			'argos', 'castigate', 'embody', 'fascinate', 'fatalism', 'flux',
			'inhabit', 'intimation', 'keening', 'lifeweb', 'mnemosynis', 'moliate',
			'outrage', 'pandemonium', 'phantasm', 'puppetry', 'serendipity', 'usury'
		], 1),
		backgrounds: fillObject([
			'ally', 'artifact', 'contact', 'eidolon', 'haunt', 'legacy',
			'mentor', 'memoriam', 'notoriety', 'relic', 'status',
		], 1),
	};

	if ('compatibility' in modules) {
		compatibility.aliases = aliases;
		compatibility.advantages = advantages;
		compatibility.defaults = {
			perm_health: 10,
			perm_willpower: 5,
			curr_willpower: 'perm_willpower',
		};
	}

	function edit() {
		pips.start();
		udfs.start();
	}

	function noedit() {
		pips.stop();
		udfs.stop();
		$('.editable').removeClass('.editable');
	}

	$.extend(globals, {edit, noedit});

	// disable example buttons
	$('.help button').on('click', function (evt) {
		evt.preventDefault();
		evt.stopPropagation();
		return false;
	});

	/*** DS API */
	let listeners = {};

	let $context;
	listeners.PreLoad = function dataPreLoad(opts) {
		let sel = `#${opts.containerId}`;
		$context = $(sel);
		$context.selector = sel;
		$context.containerId = opts.containerId;

		// init, so updaters have $context
		module.all('init', $context, slug, opts.isEditable);
		// update before preLoad
		version.update();
		module.all('preLoad', opts, $context);
	};

	listeners.PostLoad = function dataPostLoad(opts) {
		module.all('postLoad', opts, $context);

		if (opts.isEditable) {
			edit();
		} else {
			noedit();
		}
	};

	listeners.Change = function dataChange(opts) {
		let dsfName = dsf.addPrefix(opts.fieldName);

		module.all('change', opts, $context);

		if (dsf.linked.isExtra(opts.fieldName)) {
			let base = dsf.linked.base(opts.fieldName),
				$base = $(`.dsf.pips.${base}`);
			$base.each(function (i, elt) {
				pips.reassemble($(elt));
			});
		}
	};

	listeners.PreSave = function dataPreSave(opts) {
		module.all('preSave', opts, $context);
	};

	/* ${slug}_dataPreLoad, at least, must be present before the dynamic sheet framework loads DSFs, so might as well do them all. */
	function registerListeners() {
		for (let evt in listeners) {
			window[`${slug}_data${evt}`] = listeners[evt];
		}
	}

	if (slug) {
		registerListeners();
	} else {
		$(function () {
			if (! slug) {
				$slug = $('.dst_slug');
				slug = $slug.text();
				registerListeners();
			}
		});
	}

	// for debugging
	window.mll_sheet = $.extend(window.mll_sheet /*??*/|| {}, globals);
	window.mll_sheet.module = module;
	if (dbg) {
		$.extend(window, globals);
	}
})(jQuery);
