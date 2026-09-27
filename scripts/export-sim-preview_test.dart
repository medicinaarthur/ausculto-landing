// Executed through the canonical app's Flutter test runner, without app edits.
import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:ausculto_app/features/simulados/data/canonical_taxonomy.dart';
import 'package:ausculto_app/features/simulados/data/simulado_bank_catalog.dart';
import 'package:ausculto_app/features/simulados/presentation/pt_br_label_formatter.dart';

void main() {
  test('export canonical published preview relationships without counts', () {
    final site = Platform.environment['AUSCULTO_SITE_ROOT']!;
    final snapshot =
        jsonDecode(
              File(
                '$site/.local-art/correction-20260927/taxonomy-private.json',
              ).readAsStringSync(),
            )
            as Map<String, dynamic>;
    final docs = snapshot['documents'] as Map<String, dynamic>;
    final cache = docs['residency_taxonomy_cache_v1'] as Map<String, dynamic>;
    Map<String, List<String>> listMap(dynamic map) => (map as Map).map(
      (k, v) => MapEntry(k.toString(), List<String>.from(v as List)),
    );
    Map<String, int> counts(dynamic doc, String field) =>
        ((doc as Map)[field] as Map).map(
          (k, v) => MapEntry(k.toString(), (v as num).toInt()),
        );
    final themes = listMap(cache['themesBySpecialty']);
    final subs = listMap(cache['subthemesByTheme']);
    final scoped = listMap(cache['subthemesBySpecialtyAndTheme']);
    final nodes = <String, Map<String, dynamic>>{};
    final banks = SimuladoBankCatalog.entries
        .where((b) => b.code != SimuladoBankCatalog.unifiedHidden)
        .map((b) => {'id': b.code, 'label': b.title, 'description': b.subtitle})
        .toList();
    final inventories = docs.entries
        .where((d) => d.key.startsWith('residency_taxonomy_availability_v1__'))
        .map((d) => d.value as Map<String, dynamic>)
        .toList();
    List<String> bankIds(bool Function(Map<String, dynamic>) predicate) => banks
        .where(
          (b) => inventories.any(
            (d) =>
                SimuladoBankCatalog.expandUnified([
                  b['id']!,
                ]).contains(d['banca']) &&
                predicate(d),
          ),
        )
        .map((b) => b['id']!)
        .toList();
    String node(
      String kind,
      String value,
      String? parent,
      List<String> eligible,
    ) {
      final id = [
        if (parent != null) parent,
        Uri.encodeComponent(value),
      ].join('/');
      nodes[id] = {
        'id': id,
        'label': PtBrLabelFormatter.format(value),
        'kind': kind,
        'parent': parent,
        'banks': eligible,
      };
      return id;
    }

    for (final area in CanonicalTaxonomyMapper.grandesAreas()) {
      final aBanks = bankIds(
        (d) =>
            CanonicalTaxonomyMapper.sumLargeAreaCount(
              counts(d, 'largeAreaCounts'),
              area,
            ) >
            0,
      );
      if (aBanks.isEmpty) continue;
      final aId = node('areas', area, null, aBanks);
      final specialties = <String>{
        ...CanonicalTaxonomyMapper.especialidadesFor([area]),
      };
      for (final raw in listMap(cache['specialtiesByArea']).entries) {
        if (CanonicalTaxonomyMapper.resolveGrandeArea(raw.key) != area)
          continue;
        for (final s in raw.value) {
          final canonical = CanonicalTaxonomyMapper.resolveEspecialidade(
            s,
            grandeAreaScope: area,
          );
          if (canonical != null) specialties.add(canonical);
        }
      }
      for (final specialty in specialties) {
        final sBanks = bankIds(
          (d) =>
              CanonicalTaxonomyMapper.computeRedistributedSpecialtyCount(
                    specialtyCounts: counts(d, 'specialtyCounts'),
                    specialtyThemeCounts: counts(d, 'specialtyThemeCounts'),
                    canonicalEspecialidade: specialty,
                  ) >
                  0 ||
              CanonicalTaxonomyMapper.sumLargeAreaSpecialtyCount(
                    counts(d, 'largeAreaSpecialtyCounts'),
                    area,
                    specialty,
                  ) >
                  0,
        );
        if (sBanks.isEmpty) continue;
        final sId = node(
          'specialties',
          specialty,
          aId,
          sBanks.where(aBanks.contains).toList(),
        );
        for (final theme in CanonicalTaxonomyMapper.temasFor([
          specialty,
        ], themes)) {
          final tBanks = bankIds(
            (d) =>
                CanonicalTaxonomyMapper.sumSpecialtyThemeCount(
                  counts(d, 'specialtyThemeCounts'),
                  specialty,
                  theme,
                ) >
                0,
          ).where(sBanks.contains).toList();
          if (tBanks.isEmpty) continue;
          final tId = node('themes', theme, sId, tBanks);
          for (final sub in CanonicalTaxonomyMapper.subtemasFor(
            [specialty],
            [theme],
            subs,
            scoped,
          )) {
            final uBanks = bankIds(
              (d) =>
                  CanonicalTaxonomyMapper.sumSpecialtyThemeSubthemeCount(
                    counts(d, 'specialtyThemeSubthemeCounts'),
                    specialty,
                    theme,
                    sub,
                  ) >
                  0,
            ).where(tBanks.contains).toList();
            if (uBanks.isNotEmpty) node('subthemes', sub, tId, uBanks);
          }
        }
      }
    }
    expect(nodes.values.where((n) => n['kind'] == 'areas').length, 5);
    expect(
      nodes.values.where((n) => n['kind'] == 'subthemes').length,
      greaterThan(0),
    );
    final result = {
      'schemaVersion': 2,
      'source': snapshot['source'],
      'banks': banks,
      'nodes': nodes.values.toList(),
      'difficulties': [
        {'id': 'facil', 'label': 'Fácil'},
        {'id': 'intermediario', 'label': 'Intermediário'},
        {'id': 'dificil', 'label': 'Difícil'},
        {'id': 'r2', 'label': 'R2'},
      ],
      'examQuantities': [20, 50, 100],
      'focusedRange': {'min': 1, 'max': 30},
      'appUrl': 'https://app.auscultoapp.com/',
    };
    File('$site/scripts/data/academy-sim-demo.json').writeAsStringSync(
      '${const JsonEncoder.withIndent('  ').convert(result)}\n',
    );
    print(
      'Exported ${nodes.length} canonical paths (no question bodies/counts).',
    );
  });
}
