/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

class AggressiveMergingPlugin {
	constructor(options) {
		if (
			(options !== undefined && typeof options !== "object") ||
			Array.isArray(options)
		) {
			throw new Error(
				"Argument should be an options object. To use defaults, pass in nothing.\nFor more info on options, see https://webpack.js.org/plugins/"
			);
		}
		this.options = options || {};
	}

	apply(compiler) {
		const options = this.options;
		const minSizeReduce = options.minSizeReduce || 1.5;

		compiler.hooks.thisCompilation.tap(
			"AggressiveMergingPlugin",
			compilation => {
				compilation.hooks.optimizeChunksAdvanced.tap(
					"AggressiveMergingPlugin",
					chunks => {
						let chunkA;
						let chunkB;
						let biggestImprovement = -1;

						chunks.filter(chunk => !chunk.canBeInitial()).forEach((a, idx) => {
							for (let i = 0; i < idx; i++) {
								const b = chunks[i];

								const ab = b.integratedSize(a, {
									chunkOverhead: 0
								});

								if (ab !== false) {
									const aSize = b.size({
										chunkOverhead: 0
									});
									const bSize = a.size({
										chunkOverhead: 0
									});

									const improvement = (aSize + bSize) / ab;

									if (biggestImprovement < improvement) {
										biggestImprovement = improvement;
										chunkA = a;
										chunkB = b;
									}
								}
							}
						});

						if (!chunkA) return;
						if (biggestImprovement < minSizeReduce) return;

						if (chunkA.integrate(chunkB, "aggressive-merge")) {
							chunks.splice(chunks.indexOf(chunkA), 1);
							return true;
						}
					}
				);
			}
		);
	}
}

module.exports = AggressiveMergingPlugin;
