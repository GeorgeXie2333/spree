# frozen_string_literal: true

# Spree 5.4.3.1 lets the Rails admin UI locale overwrite the process-wide
# I18n.default_locale. Mobility then treats Store API requests in another
# locale as translations-only and can serialize product/category names and
# slugs as null. Keep the admin UI locale separate from catalog content, and
# repair the content default at the Store API boundary as a second safeguard.
module CenwatchLocaleIsolation
  module AdminContentLocale
    private

    def set_locale
      super

      content_locale = current_store&.default_locale.presence || I18n.default_locale
      I18n.default_locale = content_locale
      Mobility.locale = content_locale
    end
  end

  module ApiContentLocale
    private

    def set_locale
      content_locale = current_store&.default_locale.presence || I18n.default_locale
      I18n.default_locale = content_locale
      super
      Mobility.locale = current_locale
    end
  end
end

Rails.application.config.to_prepare do
  Spree::Admin::BaseController.prepend(CenwatchLocaleIsolation::AdminContentLocale)
  Spree::Api::V3::BaseController.prepend(CenwatchLocaleIsolation::ApiContentLocale)
end
