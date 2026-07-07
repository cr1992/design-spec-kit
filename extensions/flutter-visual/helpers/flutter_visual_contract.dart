import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Flutter visual contract helper template.
///
/// Copy this file into the adopting Flutter project's test helpers and adapt
/// surface extraction to the local design tokens when needed. The kit extension
/// treats project tests as the implementation authority.
Finder findByManifestAnchor(String anchor) => find.byKey(ValueKey<String>(anchor));

void expectAnchorVisible(String anchor) {
  expect(findByManifestAnchor(anchor), findsOneWidget);
}

void expectBackdropFilterPresent(String anchor) {
  final root = findByManifestAnchor(anchor);
  expect(root, findsOneWidget);
  expect(
    find.descendant(of: root, matching: find.byType(BackdropFilter)),
    findsWidgets,
  );
}

void expectAnimatedPresentationPresent(String anchor) {
  final root = findByManifestAnchor(anchor);
  expect(root, findsOneWidget);
  final animated = find.descendant(
    of: root,
    matching: find.byWidgetPredicate(
      (widget) =>
          widget is FadeTransition ||
          widget is SlideTransition ||
          widget is ScaleTransition ||
          widget is SizeTransition ||
          widget is AnimatedOpacity ||
          widget is AnimatedSlide ||
          widget is AnimatedScale ||
          widget is AnimatedContainer ||
          widget is AnimatedPositioned,
    ),
  );
  expect(animated, findsWidgets);
}

void expectDarkGlassSurface(
  String anchor, {
  double maxLuminance = 0.42,
  double minOpacity = 0.20,
}) {
  final color = _surfaceColor(anchor);
  expect(color, isNotNull, reason: 'No BoxDecoration color found under $anchor');
  expect(color!.opacity, greaterThanOrEqualTo(minOpacity));
  expect(color.computeLuminance(), lessThanOrEqualTo(maxLuminance));
  expectBackdropFilterPresent(anchor);
}

Future<void> expectThemeInvariantSurface({
  required WidgetTester tester,
  required Widget lightApp,
  required Widget darkApp,
  required String anchor,
  Future<void> Function(WidgetTester tester)? reveal,
}) async {
  await tester.pumpWidget(lightApp);
  await reveal?.call(tester);
  await tester.pump();
  final light = _surfaceSignature(anchor);

  await tester.pumpWidget(darkApp);
  await reveal?.call(tester);
  await tester.pump();
  final dark = _surfaceSignature(anchor);

  expect(dark, light);
}

Color? _surfaceColor(String anchor) {
  final root = findByManifestAnchor(anchor);
  final decorated = find.descendant(
    of: root,
    matching: find.byWidgetPredicate((widget) {
      if (widget is DecoratedBox && widget.decoration is BoxDecoration) {
        return (widget.decoration as BoxDecoration).color != null;
      }
      if (widget is Container && widget.decoration is BoxDecoration) {
        return (widget.decoration as BoxDecoration).color != null;
      }
      return false;
    }),
  );
  if (decorated.evaluate().isEmpty) return null;
  final widget = decorated.evaluate().first.widget;
  if (widget is DecoratedBox) {
    return (widget.decoration as BoxDecoration).color;
  }
  if (widget is Container) {
    return (widget.decoration as BoxDecoration).color;
  }
  return null;
}

String _surfaceSignature(String anchor) {
  final color = _surfaceColor(anchor);
  if (color == null) return 'missing';
  return [
    color.alpha,
    color.red,
    color.green,
    color.blue,
  ].join(':');
}
